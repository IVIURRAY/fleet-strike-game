/**
 * Waypoint and upgrade validation.
 */

import { hasComponent } from 'bitecs';
import type { BuildingType, PlayerId, ResourceCost } from '@fleet-strike/types';
import { BUILDING_TYPES } from '@fleet-strike/types';
import { BUILDINGS, discountedUpgradeCost, nextUpgrade } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import { BuildingClass, Owner, UnderConstruction, buildingQuery } from '@fleet-strike/ecs';
import { hasResources, isFiniteNumber, isWithinWorld, missingResource } from '@fleet-strike/utils';

import { fail, ok } from './shared';
import type { ValidationResult } from './shared';

/** A validated waypoint move. */
export interface WaypointAction {
  readonly x: number;
  readonly y: number;
}

/** Validates a waypoint placement. */
export function validateWaypoint(x: unknown, y: unknown): ValidationResult<WaypointAction> {
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
    return fail('Waypoint coordinates must be finite numbers');
  }
  if (!isWithinWorld(x, y)) {
    return fail('Waypoint is outside the map');
  }
  return ok({ x, y });
}

/** A validated upgrade. */
export interface UpgradeAction {
  readonly buildingId: number;
  readonly type: BuildingType;
  readonly newLevel: number;
  readonly cost: ResourceCost;
}

/** Validates an upgrade command. */
export function validateUpgrade(
  world: GameWorld,
  playerId: PlayerId,
  buildingId: unknown
): ValidationResult<UpgradeAction> {
  if (typeof buildingId !== 'number' || !Number.isInteger(buildingId) || buildingId < 0) {
    return fail('Building id must be a non-negative integer');
  }

  const buildings = buildingQuery(world);
  if (!buildings.includes(buildingId)) {
    return fail('No such building');
  }
  if ((Owner.playerId[buildingId] as number) !== playerId) {
    return fail('You do not own that building');
  }
  if (hasComponent(world, UnderConstruction, buildingId)) {
    return fail('That building is still under construction');
  }

  const type = BUILDING_TYPES[BuildingClass.typeId[buildingId] as number];
  if (type === undefined) {
    return fail('Unknown building type');
  }

  const level = BuildingClass.level[buildingId] as number;
  const upgrade = nextUpgrade(type, level);
  if (upgrade === null) {
    return fail(`${BUILDINGS[type].name} is already fully upgraded`);
  }

  const player = world.context.players.get(playerId);
  if (player === undefined) {
    return fail('Unknown player');
  }

  const cost = discountedUpgradeCost(upgrade.cost, player.upgradeDiscount);
  if (!hasResources(player.resources, cost)) {
    return fail(`Not enough ${missingResource(player.resources, cost) ?? 'resources'}`);
  }

  return ok({ buildingId, type, newLevel: upgrade.level, cost });
}
