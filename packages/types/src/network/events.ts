/**
 * In-match game events pushed from server to client.
 *
 * These drive transient client-side feedback (explosions, toasts, audio) that
 * cannot be derived from a state snapshot alone.
 */

import type { OwnerId, PlayerId } from '../game/common';
import type { BuildingType } from '../game/buildings';
import type { ShipType } from '../game/ships';

/** A ship or building was destroyed. */
export interface EntityDestroyedEvent {
  readonly type: 'ENTITY_DESTROYED';
  readonly entityId: number;
  readonly x: number;
  readonly y: number;
  /** Radius hint for the explosion effect. */
  readonly scale: number;
}

/** A ship finished production and entered the world. */
export interface ShipSpawnedEvent {
  readonly type: 'SHIP_SPAWNED';
  readonly entityId: number;
  readonly shipType: ShipType;
  readonly owner: PlayerId;
  readonly x: number;
  readonly y: number;
}

/** A building finished construction. */
export interface BuildingCompletedEvent {
  readonly type: 'BUILDING_COMPLETED';
  readonly buildingId: number;
  readonly buildingType: BuildingType;
  readonly owner: PlayerId;
}

/** Planet ownership changed. */
export interface PlanetCapturedEvent {
  readonly type: 'PLANET_CAPTURED';
  readonly planetIndex: number;
  readonly previousOwner: OwnerId;
  readonly newOwner: OwnerId;
}

/** A weapon fired, for muzzle flashes and audio. */
export interface WeaponFiredEvent {
  readonly type: 'WEAPON_FIRED';
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly weaponType: string;
  /** True for hitscan beams, which need a drawn line rather than a projectile. */
  readonly isHitscan: boolean;
  readonly targetX: number;
  readonly targetY: number;
}

/** A command was rejected. Surfaced as a UI toast. */
export interface CommandRejectedEvent {
  readonly type: 'COMMAND_REJECTED';
  readonly reason: string;
}

export type GameEvent =
  | EntityDestroyedEvent
  | ShipSpawnedEvent
  | BuildingCompletedEvent
  | PlanetCapturedEvent
  | WeaponFiredEvent
  | CommandRejectedEvent;
