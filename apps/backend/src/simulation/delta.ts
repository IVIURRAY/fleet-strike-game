/**
 * Delta compression.
 *
 * A full snapshot with 300 ships is a few hundred kilobytes of JSON; sending
 * that 30 times a second is not viable. This tracks the last value broadcast
 * for each entity and emits only fields that actually changed, plus the ids of
 * entities that disappeared.
 *
 * docs/Technical_Architecture.md asks for delta updates with a periodic full
 * snapshot as a baseline; `shouldSendFullSnapshot` drives that cadence.
 */

import type {
  EntityUpdate,
  ProjectileSnapshot,
  ShipSnapshot,
  StateUpdateMessage,
  WorldSnapshot,
} from '@fleet-strike/types';
import { BROADCAST_RATE, FULL_SNAPSHOT_INTERVAL } from '@fleet-strike/config';

/** The subset of entity state that deltas track. */
interface TrackedEntity {
  x: number;
  y: number;
  rotation: number;
  hp: number;
}

export class DeltaTracker {
  private readonly previous = new Map<number, TrackedEntity>();
  /** Ids present in the previous frame, reused to detect removals. */
  private readonly seen = new Set<number>();
  private lastFullSnapshotTick = -Infinity;

  /** True when a full baseline snapshot is due. */
  shouldSendFullSnapshot(tick: number): boolean {
    const interval = FULL_SNAPSHOT_INTERVAL * BROADCAST_RATE;
    return tick - this.lastFullSnapshotTick >= interval;
  }

  /** Records that a full snapshot was sent at `tick`. */
  markFullSnapshot(tick: number, snapshot: WorldSnapshot): void {
    this.lastFullSnapshotTick = tick;
    this.reset();
    for (const ship of snapshot.ships) {
      this.remember(ship);
    }
  }

  /**
   * Diffs `snapshot` against the last broadcast state.
   *
   * Projectiles are always sent in full rather than diffed: they live for a
   * couple of seconds, move every tick and never change any other field, so
   * diffing them costs more than it saves.
   */
  buildUpdate(snapshot: WorldSnapshot): StateUpdateMessage {
    const entities: EntityUpdate[] = [];
    const created: ShipSnapshot[] = [];
    const removed: number[] = [];
    const currentIds = new Set<number>();

    for (const ship of snapshot.ships) {
      currentIds.add(ship.id);
      const previous = this.previous.get(ship.id);

      if (previous === undefined) {
        created.push(ship);
        this.remember(ship);
        continue;
      }

      const update = diff(ship, previous);
      if (update !== null) {
        entities.push(update);
        previous.x = ship.x;
        previous.y = ship.y;
        previous.rotation = ship.rotation;
        previous.hp = ship.hp;
      }
    }

    for (const id of this.previous.keys()) {
      if (!currentIds.has(id)) removed.push(id);
    }
    for (const id of removed) {
      this.previous.delete(id);
    }

    return {
      type: 'STATE_UPDATE',
      tick: snapshot.tick,
      elapsed: snapshot.elapsed,
      entities,
      removed,
      created,
      projectiles: snapshot.projectiles as readonly ProjectileSnapshot[],
      // Planets, buildings and players are small and low-churn, so they are
      // sent whole. Diffing them would add complexity for negligible gain.
      planets: snapshot.planets,
      buildings: snapshot.buildings,
      players: snapshot.players,
    };
  }

  /** Forgets all tracked state, forcing the next update to resend everything. */
  reset(): void {
    this.previous.clear();
    this.seen.clear();
  }

  /** Number of entities currently tracked. */
  get trackedCount(): number {
    return this.previous.size;
  }

  private remember(ship: ShipSnapshot): void {
    this.previous.set(ship.id, {
      x: ship.x,
      y: ship.y,
      rotation: ship.rotation,
      hp: ship.hp,
    });
  }
}

/** Returns only the changed fields, or `null` when nothing changed. */
function diff(ship: ShipSnapshot, previous: TrackedEntity): EntityUpdate | null {
  let changed = false;
  const update: {
    id: number;
    x?: number;
    y?: number;
    rotation?: number;
    hp?: number;
  } = { id: ship.id };

  if (ship.x !== previous.x) {
    update.x = ship.x;
    changed = true;
  }
  if (ship.y !== previous.y) {
    update.y = ship.y;
    changed = true;
  }
  if (ship.rotation !== previous.rotation) {
    update.rotation = ship.rotation;
    changed = true;
  }
  if (ship.hp !== previous.hp) {
    update.hp = ship.hp;
    changed = true;
  }

  return changed ? update : null;
}
