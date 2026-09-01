/**
 * Shared validation primitives.
 *
 * Validators are pure: they inspect the world and return either a concrete
 * action or a rejection reason, leaving all mutation to the caller. That keeps
 * them trivially testable and means the authoritative checks cannot be bypassed
 * by a code path that forgets to validate.
 */

import type { PlayerId } from '@fleet-strike/types';
import { BUILDING_TYPES } from '@fleet-strike/types';
import { BUILDINGS, PLANET_BASE_POWER, powerCapacity } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import { BuildingClass, Owner, Parent, PlanetRef, buildingQuery } from '@fleet-strike/ecs';

/** Outcome of validating a command. */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; reason: string };

/** Wraps a successful validation. */
export function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

/** Wraps a rejection. */
export function fail<T>(reason: string): ValidationResult<T> {
  return { ok: false, reason };
}

/** Counts buildings attached to a specific parent entity. */
export function countBuildingsOnParent(world: GameWorld, parentEntity: number): number {
  const buildings = buildingQuery(world);
  let count = 0;
  for (let i = 0; i < buildings.length; i += 1) {
    const eid = buildings[i] as number;
    if (Parent.entity[eid] === parentEntity) count += 1;
  }
  return count;
}

/**
 * True when a planet has power headroom for a building drawing `required`.
 *
 * Power is a hard gate, not an efficiency penalty (docs/ResourcesEconomy.md).
 */
export function hasSparePower(
  world: GameWorld,
  planetIndex: number,
  playerId: PlayerId,
  required: number
): boolean {
  if (required <= 0) return true;

  let capacity = PLANET_BASE_POWER;
  let used = 0;

  const buildings = buildingQuery(world);
  for (let i = 0; i < buildings.length; i += 1) {
    const eid = buildings[i] as number;
    if ((PlanetRef.index[eid] as number) !== planetIndex) continue;
    if ((Owner.playerId[eid] as number) !== playerId) continue;

    const type = BUILDING_TYPES[BuildingClass.typeId[eid] as number];
    if (type === undefined) continue;

    const level = BuildingClass.level[eid] as number;
    capacity += powerCapacity(type, level);
    used += BUILDINGS[type].power;
  }

  return used + required <= capacity;
}
