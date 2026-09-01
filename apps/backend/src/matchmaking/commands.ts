/**
 * Applies validated client commands to the world.
 *
 * Split out of `GameRoom` so the room is responsible only for the loop,
 * connections and broadcasting, while all state mutation lives here.
 */

import type { BuildingType, PlayerId } from '@fleet-strike/types';
import { buildingMaxHp, nextUpgrade, productionInterval } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import {
  BuildingClass,
  Health,
  Owner,
  Production,
  WaypointFollower,
  createBuilding,
  recalculateIncome,
  waypointQuery,
} from '@fleet-strike/ecs';
import { spend } from '@fleet-strike/utils';

import { validateBuild, validateUpgrade, validateWaypoint } from '../validation';
import type { ValidateBuildParams } from '../validation';

/** Result of applying a command: either accepted, or rejected with a reason. */
export type CommandOutcome = { ok: true } | { ok: false; reason: string };

const ACCEPTED: CommandOutcome = { ok: true };

/** Moves a player's fleet rally point and retargets every ship they own. */
export function applyWaypoint(
  world: GameWorld,
  playerId: PlayerId,
  x: number,
  y: number
): CommandOutcome {
  const result = validateWaypoint(x, y);
  if (!result.ok) return { ok: false, reason: result.reason };

  const player = world.context.players.get(playerId);
  if (player === undefined) return { ok: false, reason: 'Unknown player' };

  player.waypoint.x = result.value.x;
  player.waypoint.y = result.value.y;

  // The MVP has one waypoint per player, so this is a full sweep of their ships
  // rather than a per-group update.
  const ships = waypointQuery(world);
  for (let i = 0; i < ships.length; i += 1) {
    const eid = ships[i] as number;
    if ((Owner.playerId[eid] as number) !== playerId) continue;
    WaypointFollower.targetX[eid] = result.value.x;
    WaypointFollower.targetY[eid] = result.value.y;
    WaypointFollower.arrived[eid] = 0;
  }

  return ACCEPTED;
}

/** Dependencies the build command needs to resolve entities and positions. */
export interface BuildResolvers {
  readonly resolvePlanetEntity: ValidateBuildParams['resolvePlanetEntity'];
  readonly resolveMoonEntity: ValidateBuildParams['resolveMoonEntity'];
  readonly allocatePosition: ValidateBuildParams['allocatePosition'];
}

/** Validates and constructs a building. */
export function applyBuild(
  world: GameWorld,
  playerId: PlayerId,
  planetIndex: number,
  moonId: string | null,
  buildingType: string,
  resolvers: BuildResolvers
): CommandOutcome {
  const result = validateBuild({
    world,
    playerId,
    planetIndex,
    moonId,
    buildingType,
    ...resolvers,
  });

  if (!result.ok) return { ok: false, reason: result.reason };

  const player = world.context.players.get(playerId);
  if (player === undefined) return { ok: false, reason: 'Unknown player' };

  // Validation already checked affordability, but spend re-checks so a race
  // between validation and application cannot produce a negative balance.
  if (!spend(player.resources, result.value.cost)) {
    return { ok: false, reason: 'Not enough resources' };
  }

  createBuilding(world, {
    type: result.value.type,
    owner: playerId,
    x: result.value.x,
    y: result.value.y,
    planetIndex: result.value.planetIndex,
    parentEntity: result.value.parentEntity,
    incomeMultiplier: result.value.incomeMultiplier,
    productionSpeedBonus: player.productionSpeedBonus,
  });

  player.stats.buildingsConstructed += 1;
  recalculateIncome(world);

  return ACCEPTED;
}

/** Validates and applies a building upgrade. */
export function applyUpgrade(
  world: GameWorld,
  playerId: PlayerId,
  buildingId: number
): CommandOutcome {
  const result = validateUpgrade(world, playerId, buildingId);
  if (!result.ok) return { ok: false, reason: result.reason };

  const player = world.context.players.get(playerId);
  if (player === undefined) return { ok: false, reason: 'Unknown player' };
  if (!spend(player.resources, result.value.cost)) {
    return { ok: false, reason: 'Not enough resources' };
  }

  const { buildingId: eid, type, newLevel } = result.value;
  BuildingClass.level[eid] = newLevel;

  applyUpgradeEffects(world, eid, type, newLevel, player.productionSpeedBonus);
  applyPlayerWideUpgradeEffects(world, playerId, type, newLevel);

  recalculateIncome(world);
  return ACCEPTED;
}

/** Applies the upgrade's effects to the building itself. */
function applyUpgradeEffects(
  world: GameWorld,
  eid: number,
  type: BuildingType,
  newLevel: number,
  productionSpeedBonus: number
): void {
  // Upgrades raise maximum HP; the building heals by the same amount so an
  // upgrade is never a temporary vulnerability.
  const previousMax = Health.max[eid] as number;
  const newMax = buildingMaxHp(type, newLevel);
  Health.max[eid] = newMax;
  Health.current[eid] = (Health.current[eid] as number) + (newMax - previousMax);

  const upgrade = nextUpgrade(type, newLevel - 1);
  if (upgrade?.productionInterval === undefined) return;
  if (Production.interval[eid] === undefined) return;

  const interval = productionInterval(type, newLevel, productionSpeedBonus);
  Production.interval[eid] = interval;
  // Never extend a cycle already in progress past the new, shorter interval.
  if ((Production.remaining[eid] as number) > interval) {
    Production.remaining[eid] = interval;
  }
  void world;
}

/** Research Labs change values that apply to the whole player, not one building. */
function applyPlayerWideUpgradeEffects(
  world: GameWorld,
  playerId: PlayerId,
  type: BuildingType,
  newLevel: number
): void {
  const player = world.context.players.get(playerId);
  if (player === undefined) return;

  const upgrade = nextUpgrade(type, newLevel - 1);
  if (upgrade === null) return;

  if (upgrade.upgradeDiscount !== undefined) {
    player.upgradeDiscount = upgrade.upgradeDiscount;
  }
  if (upgrade.productionSpeedBonus !== undefined) {
    player.productionSpeedBonus = upgrade.productionSpeedBonus;
  }
}
