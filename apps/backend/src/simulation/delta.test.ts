import { beforeEach, describe, expect, it } from 'vitest';

import { BROADCAST_RATE, FULL_SNAPSHOT_INTERVAL } from '@fleet-strike/config';
import type { WorldSnapshot } from '@fleet-strike/types';

import { DeltaTracker } from './delta';

/** Builds a minimal snapshot with the given ships. */
function snapshot(
  tick: number,
  ships: Array<{ id: number; x: number; y: number; rotation?: number; hp?: number }>
): WorldSnapshot {
  return {
    tick,
    elapsed: tick / 60,
    phase: 'playing',
    players: [],
    planets: [],
    moons: [],
    buildings: [],
    ships: ships.map((ship) => ({
      id: ship.id,
      type: 0,
      owner: 1 as const,
      x: ship.x,
      y: ship.y,
      rotation: ship.rotation ?? 0,
      hp: ship.hp ?? 80,
      maxHp: 80,
    })),
    projectiles: [],
    result: null,
  };
}

describe('DeltaTracker baseline cadence', () => {
  let tracker: DeltaTracker;

  beforeEach(() => {
    tracker = new DeltaTracker();
  });

  it('wants a full snapshot immediately', () => {
    expect(tracker.shouldSendFullSnapshot(0)).toBe(true);
  });

  it('does not want another straight away', () => {
    tracker.markFullSnapshot(0, snapshot(0, []));
    expect(tracker.shouldSendFullSnapshot(1)).toBe(false);
  });

  it('wants one again after the configured interval', () => {
    tracker.markFullSnapshot(0, snapshot(0, []));
    const dueAt = FULL_SNAPSHOT_INTERVAL * BROADCAST_RATE;
    expect(tracker.shouldSendFullSnapshot(dueAt - 1)).toBe(false);
    expect(tracker.shouldSendFullSnapshot(dueAt)).toBe(true);
  });
});

describe('DeltaTracker diffing', () => {
  let tracker: DeltaTracker;

  beforeEach(() => {
    tracker = new DeltaTracker();
  });

  it('reports new ships as created, not as deltas', () => {
    const update = tracker.buildUpdate(snapshot(1, [{ id: 10, x: 0, y: 0 }]));
    expect(update.created).toHaveLength(1);
    expect(update.created[0]?.id).toBe(10);
    expect(update.entities).toHaveLength(0);
  });

  it('emits nothing when nothing changed', () => {
    tracker.buildUpdate(snapshot(1, [{ id: 10, x: 0, y: 0 }]));
    const update = tracker.buildUpdate(snapshot(2, [{ id: 10, x: 0, y: 0 }]));
    expect(update.created).toHaveLength(0);
    expect(update.entities).toHaveLength(0);
    expect(update.removed).toHaveLength(0);
  });

  it('emits only the fields that changed', () => {
    tracker.buildUpdate(snapshot(1, [{ id: 10, x: 0, y: 0, rotation: 0, hp: 80 }]));
    const update = tracker.buildUpdate(snapshot(2, [{ id: 10, x: 5, y: 0, rotation: 0, hp: 80 }]));

    expect(update.entities).toHaveLength(1);
    const entity = update.entities[0]!;
    expect(entity.id).toBe(10);
    expect(entity.x).toBe(5);
    // Unchanged fields must be absent so the payload stays small.
    expect(entity.y).toBeUndefined();
    expect(entity.rotation).toBeUndefined();
    expect(entity.hp).toBeUndefined();
  });

  it('tracks health changes', () => {
    tracker.buildUpdate(snapshot(1, [{ id: 10, x: 0, y: 0, hp: 80 }]));
    const update = tracker.buildUpdate(snapshot(2, [{ id: 10, x: 0, y: 0, hp: 40 }]));
    expect(update.entities[0]?.hp).toBe(40);
    expect(update.entities[0]?.x).toBeUndefined();
  });

  it('reports removed ships once and then forgets them', () => {
    tracker.buildUpdate(
      snapshot(1, [
        { id: 10, x: 0, y: 0 },
        { id: 11, x: 1, y: 1 },
      ])
    );

    const update = tracker.buildUpdate(snapshot(2, [{ id: 10, x: 0, y: 0 }]));
    expect(update.removed).toEqual([11]);

    const next = tracker.buildUpdate(snapshot(3, [{ id: 10, x: 0, y: 0 }]));
    expect(next.removed).toHaveLength(0);
  });

  it('handles a ship being created and removed across frames', () => {
    tracker.buildUpdate(snapshot(1, [{ id: 10, x: 0, y: 0 }]));
    const spawned = tracker.buildUpdate(
      snapshot(2, [
        { id: 10, x: 0, y: 0 },
        { id: 12, x: 9, y: 9 },
      ])
    );
    expect(spawned.created.map((s) => s.id)).toEqual([12]);

    const gone = tracker.buildUpdate(snapshot(3, [{ id: 12, x: 9, y: 9 }]));
    expect(gone.removed).toEqual([10]);
  });

  it('resends everything after a reset', () => {
    tracker.buildUpdate(snapshot(1, [{ id: 10, x: 0, y: 0 }]));
    tracker.reset();
    const update = tracker.buildUpdate(snapshot(2, [{ id: 10, x: 0, y: 0 }]));
    expect(update.created).toHaveLength(1);
  });

  it('uses a full snapshot as the delta baseline', () => {
    const base = snapshot(1, [{ id: 10, x: 100, y: 100 }]);
    tracker.markFullSnapshot(1, base);

    // Identical state after the baseline means no delta at all.
    const unchanged = tracker.buildUpdate(snapshot(2, [{ id: 10, x: 100, y: 100 }]));
    expect(unchanged.created).toHaveLength(0);
    expect(unchanged.entities).toHaveLength(0);
  });

  it('always sends projectiles in full', () => {
    const withProjectiles: WorldSnapshot = {
      ...snapshot(1, []),
      projectiles: [{ id: 50, weapon: 2, owner: 1, x: 10, y: 20, rotation: 0 }],
    };
    const update = tracker.buildUpdate(withProjectiles);
    expect(update.projectiles).toHaveLength(1);
  });

  it('substantially shrinks the payload for a large mostly-idle fleet', () => {
    const ships = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, x: i, y: 0 }));
    tracker.buildUpdate(snapshot(1, ships));

    // Only ten ships actually moved this frame.
    const moved = ships.map((ship, i) => (i < 10 ? { ...ship, x: ship.x + 1 } : ship));
    const update = tracker.buildUpdate(snapshot(2, moved));

    expect(update.entities).toHaveLength(10);
    const deltaBytes = JSON.stringify(update).length;
    const fullBytes = JSON.stringify(snapshot(2, moved)).length;
    expect(deltaBytes).toBeLessThan(fullBytes / 2);
  });

  it('reports how many entities it is tracking', () => {
    tracker.buildUpdate(
      snapshot(1, [
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 0, y: 0 },
      ])
    );
    expect(tracker.trackedCount).toBe(2);
  });
});
