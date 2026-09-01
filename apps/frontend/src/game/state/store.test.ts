import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ShipSnapshot, StateUpdateMessage, WorldSnapshot } from '@fleet-strike/types';

import { GameStore } from './store';

function ship(overrides: Partial<ShipSnapshot> = {}): ShipSnapshot {
  return {
    id: 1,
    type: 0,
    owner: 1,
    x: 0,
    y: 0,
    rotation: 0,
    hp: 80,
    maxHp: 80,
    ...overrides,
  };
}

function snapshot(overrides: Partial<WorldSnapshot> = {}): WorldSnapshot {
  return {
    tick: 0,
    elapsed: 0,
    phase: 'playing',
    players: [],
    planets: [],
    moons: [],
    buildings: [],
    ships: [],
    projectiles: [],
    result: null,
    ...overrides,
  };
}

function update(overrides: Partial<StateUpdateMessage> = {}): StateUpdateMessage {
  return {
    type: 'STATE_UPDATE',
    tick: 1,
    elapsed: 1,
    entities: [],
    removed: [],
    created: [],
    projectiles: [],
    planets: [],
    buildings: [],
    players: [],
    ...overrides,
  };
}

const player = (id: 1 | 2, name: string) => ({
  id,
  name,
  status: 'connected' as const,
  resources: { gold: 165, manpower: 50, crystal: 0, gas: 0, tungsten: 0 },
  income: { gold: 5, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
  caps: { manpower: 200, crystal: 500, gas: 500, tungsten: 500 },
  waypoint: { x: 100, y: 200 },
  controlledPlanets: [id === 1 ? 0 : 6],
  shipCount: 8,
});

beforeEach(() => {
  // performance.now is used to pace interpolation.
  vi.spyOn(performance, 'now').mockReturnValue(0);
});

describe('GameStore snapshots', () => {
  it('starts empty', () => {
    const store = new GameStore();
    expect(store.ships.size).toBe(0);
    expect(store.phase).toBe('lobby');
    expect(store.me).toBeNull();
  });

  it('applies a full snapshot', () => {
    const store = new GameStore();
    store.applySnapshot(
      snapshot({
        tick: 42,
        elapsed: 7,
        ships: [ship({ id: 5, x: 10 })],
        players: [player(1, 'Ada')],
      })
    );

    expect(store.tick).toBe(42);
    expect(store.elapsed).toBe(7);
    expect(store.ships.size).toBe(1);
    expect(store.ships.get(5)?.x).toBe(10);
  });

  it('removes ships absent from a later snapshot', () => {
    const store = new GameStore();
    store.applySnapshot(snapshot({ ships: [ship({ id: 1 }), ship({ id: 2 })] }));
    store.applySnapshot(snapshot({ ships: [ship({ id: 1 })] }));
    expect(store.ships.has(2)).toBe(false);
    expect(store.ships.has(1)).toBe(true);
  });

  it('preserves interpolation history across snapshots', () => {
    const store = new GameStore();
    store.applySnapshot(snapshot({ ships: [ship({ id: 1, x: 0 })] }));
    store.applySnapshot(snapshot({ ships: [ship({ id: 1, x: 50 })] }));

    const tracked = store.ships.get(1);
    // A full snapshot must not snap the ship; the previous position is kept so
    // the renderer can interpolate.
    expect(tracked?.prevX).toBe(0);
    expect(tracked?.x).toBe(50);
  });

  it('identifies the local player and the opponent', () => {
    const store = new GameStore();
    store.playerId = 2;
    store.applySnapshot(snapshot({ players: [player(1, 'Ada'), player(2, 'Grace')] }));

    expect(store.me?.name).toBe('Grace');
    expect(store.opponent?.name).toBe('Ada');
  });
});

describe('GameStore deltas', () => {
  let store: GameStore;

  beforeEach(() => {
    store = new GameStore();
    store.applySnapshot(snapshot({ ships: [ship({ id: 1, x: 0, y: 0, hp: 80 })] }));
  });

  it('adds created ships', () => {
    store.applyUpdate(update({ created: [ship({ id: 2, x: 5 })] }));
    expect(store.ships.has(2)).toBe(true);
  });

  it('applies partial field updates and leaves others alone', () => {
    store.applyUpdate(update({ entities: [{ id: 1, x: 25 }] }));

    const tracked = store.ships.get(1);
    expect(tracked?.x).toBe(25);
    expect(tracked?.y).toBe(0);
    expect(tracked?.hp).toBe(80);
  });

  it('shifts the previous position when a delta arrives', () => {
    store.applyUpdate(update({ entities: [{ id: 1, x: 25 }] }));
    const tracked = store.ships.get(1);
    expect(tracked?.prevX).toBe(0);
    expect(tracked?.x).toBe(25);
  });

  it('applies health changes', () => {
    store.applyUpdate(update({ entities: [{ id: 1, hp: 30 }] }));
    expect(store.ships.get(1)?.hp).toBe(30);
  });

  it('removes ships listed as removed', () => {
    store.applyUpdate(update({ removed: [1] }));
    expect(store.ships.has(1)).toBe(false);
  });

  it('ignores deltas for unknown ships', () => {
    expect(() => store.applyUpdate(update({ entities: [{ id: 999, x: 1 }] }))).not.toThrow();
    expect(store.ships.has(999)).toBe(false);
  });

  it('resets a ship age when it updates', () => {
    store.advance(0.5);
    expect(store.ships.get(1)?.age).toBeCloseTo(0.5, 6);
    store.applyUpdate(update({ entities: [{ id: 1, x: 1 }] }));
    expect(store.ships.get(1)?.age).toBe(0);
  });
});

describe('GameStore interpolation', () => {
  it('starts at zero and reaches one', () => {
    const store = new GameStore();
    store.applySnapshot(snapshot({ ships: [ship({ id: 1 })] }));
    const tracked = store.ships.get(1)!;

    expect(store.interpolationFactor(tracked)).toBe(0);

    store.advance(10);
    expect(store.interpolationFactor(tracked)).toBe(1);
  });

  it('clamps rather than extrapolating past the target', () => {
    const store = new GameStore();
    store.applySnapshot(snapshot({ ships: [ship({ id: 1 })] }));
    const tracked = store.ships.get(1)!;
    store.advance(100);
    expect(store.interpolationFactor(tracked)).toBeLessThanOrEqual(1);
  });
});

describe('GameStore queries', () => {
  let store: GameStore;

  beforeEach(() => {
    store = new GameStore();
    store.playerId = 1;
    store.applySnapshot(
      snapshot({
        players: [player(1, 'Ada'), player(2, 'Grace')],
        planets: [
          { index: 0, owner: 1, captureProgress: -100, presence: { 1: 3, 2: 0 } },
          { index: 3, owner: 0, captureProgress: 0, presence: { 1: 0, 2: 0 } },
        ],
        buildings: [
          {
            id: 10,
            type: 'goldMine',
            owner: 1,
            planetIndex: 0,
            x: 0,
            y: 0,
            level: 1,
            hp: 350,
            maxHp: 350,
            buildProgress: 1,
            productionRemaining: 0,
            isStalled: false,
          },
        ],
      })
    );
  });

  it('looks up planets by index', () => {
    expect(store.planetAt(0)?.owner).toBe(1);
    expect(store.planetAt(99)).toBeUndefined();
  });

  it('reports planet control for the local player', () => {
    expect(store.controlsPlanet(0)).toBe(true);
    expect(store.controlsPlanet(3)).toBe(false);
  });

  it('filters buildings by planet', () => {
    expect(store.buildingsOnPlanet(0)).toHaveLength(1);
    expect(store.buildingsOnPlanet(3)).toHaveLength(0);
  });
});

describe('GameStore reset', () => {
  it('clears match state', () => {
    const store = new GameStore();
    store.applySnapshot(
      snapshot({ tick: 10, ships: [ship({ id: 1 })], players: [player(1, 'A')] })
    );
    store.reset();

    expect(store.ships.size).toBe(0);
    expect(store.players).toHaveLength(0);
    expect(store.phase).toBe('lobby');
    expect(store.tick).toBe(0);
  });
});
