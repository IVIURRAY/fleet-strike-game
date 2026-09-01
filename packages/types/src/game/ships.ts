/**
 * Ship (unit) domain types.
 *
 * Source: docs/Complete_Units_and_Buildings.md ("MVP Core Units").
 * Phase 2 units (Spy, Shield Frigate, Miner, Drone Carrier, Ram) are
 * deliberately excluded — see docs/GameLoop.md "Deferred to Phase 2+".
 */

import type { ResourceCost } from './resources';
import type { ArmorType, WeaponStats } from './combat';

/** The seven MVP ship classes listed in docs/GameLoop.md. */
export const SHIP_TYPES = [
  'scout',
  'soldier',
  'heavy',
  'medic',
  'engineer',
  'bomber',
  'sniper',
] as const;
export type ShipType = (typeof SHIP_TYPES)[number];

/** Static, data-driven definition of a ship class. */
export interface ShipDefinition {
  readonly type: ShipType;
  /** Display name, e.g. "Scout Fighter". */
  readonly name: string;
  /** Flavour nickname from the design docs, e.g. "Swift Interceptor". */
  readonly nickname: string;
  readonly role: string;
  readonly cost: ResourceCost;
  readonly maxHp: number;
  readonly armor: ArmorType;
  /** Cruise speed in units/second. */
  readonly maxSpeed: number;
  /** Minimum speed — ships never fully stop, they loiter. */
  readonly minSpeed: number;
  /** Turn rate in degrees/second. */
  readonly turnRate: number;
  /** Collision radius in world units. */
  readonly hitboxRadius: number;
  /** Distance at which the ship will acquire a target. */
  readonly detectionRange: number;
  readonly weapons: readonly WeaponStats[];
  /** Capture points generated per second within a planet's capture radius. */
  readonly captureRate: number;
  /** HP restored per second to a single ally, `0` for non-support ships. */
  readonly repairPerSecond: number;
  /** Number of allies the repair beam can service simultaneously. */
  readonly repairTargets: number;
  /** Range of the repair beam in world units. */
  readonly repairRange: number;
  /** PixiJS texture key. */
  readonly texture: string;
}

/** A ship as exposed to the client for rendering and UI. */
export interface Ship {
  readonly id: EntityIdAlias;
  readonly type: ShipType;
  readonly owner: 1 | 2;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly hp: number;
  readonly maxHp: number;
}

/** Local alias to avoid a circular import with `common.ts`. */
type EntityIdAlias = number;

/** Highest weapon range across all of a ship's mounts. */
export function maxWeaponRange(definition: ShipDefinition): number {
  let best = 0;
  for (const weapon of definition.weapons) {
    if (weapon.range > best) best = weapon.range;
  }
  return best;
}
