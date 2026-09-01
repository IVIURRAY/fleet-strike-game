/**
 * Client command validation.
 *
 * The server is authoritative, so every command is re-checked here regardless of
 * what the client believes. Validators are pure: they inspect the world and
 * return either a concrete action or a rejection reason, leaving mutation to the
 * caller. That keeps them trivially testable.
 */

import { hasComponent } from 'bitecs';
import type {
  BuildingType,
  PlayerId,
  ResourceCost,
} from '@fleet-strike/types';
import { BUILDING_TYPES } from '@fleet-strike/types';
import {
  BUILDINGS,
  PLANETS,
  PLANET_BASE_POWER,
  discountedUpgradeCost,
  nextUpgrade,
  powerCapacity,
} from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import {
  BuildingClass,
  Owner,
  Parent,
  PlanetRef,
  UnderConstruction,
  buildingQuery,
} from '@fleet-strike/ecs';
import { hasResources, isFiniteNumber, isWithinWorld, missingResource } from '@fleet-strike/utils';

/** Outcome of validating a command. */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; reason: string };

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function fail<T>(reason: string): ValidationResult<T> {
  return { ok: false, reason };
}

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

/** A validated building placement. */
export interface BuildAction {
  readonly type: BuildingType;
  readonly planetIndex: number;
  readonly moonId: string | null;
  readonly cost: ResourceCost;
  readonly parentEntity: number;
  readonly x: number;
  readonly y: number;
  readonly incomeMultiplier: number;
}

/** Parameters for validating a build command. */
export interface ValidateBuildParams {
  readonly world: GameWorld;
  readonly playerId: PlayerId;
  readonly planetIndex: unknown;
  readonly moonId: unknown;
  readonly buildingType: unknown;
  /** Resolves the planet entity for a chain index. */
  readonly resolvePlanetEntity: (index: number) => number;
  /** Resolves the moon entity for a moon id. */
  readonly resolveMoonEntity: (moonId: string) => number;
  /** Chooses a world position for the next building on this site. */
  readonly allocatePosition: (planetIndex: number, moonId: string | null) => { x: number; y: number };
}

/**
 * Validates a build command.
 *
 * Checks, in order: the building type exists, the planet index is real, the
 * player controls the planet, the site accepts this building class, moon slot
 * limits are respected, the planet has spare power, and the player can pay.
 */
export function validateBuild(params: ValidateBuildParams): ValidationResult<BuildAction> {
  const { world, playerId, resolvePlanetEntity, resolveMoonEntity, allocatePosition } = params;

  if (typeof params.buildingType !== 'string') {
    return fail('Building type must be a string');
  }
  const buildingType = params.buildingType as BuildingType;
  const definition = BUILDINGS[buildingType];
  if (definition === undefined) {
    return fail(`Unknown building type: ${params.buildingType}`);
  }
  if (buildingType === 'commandCenter') {
    return fail('Command Centers cannot be constructed');
  }

  if (typeof params.planetIndex !== 'number' || !Number.isInteger(params.planetIndex)) {
    return fail('Planet index must be an integer');
  }
  const planet = PLANETS[params.planetIndex];
  if (planet === undefined) {
    return fail('No such planet');
  }
  const planetIndex = params.planetIndex;

  const planetEntity = resolvePlanetEntity(planetIndex);
  if (planetEntity === 0) {
    return fail('Planet is not present in this match');
  }
  if ((Owner.playerId[planetEntity] as number) !== playerId) {
    return fail('You do not control that planet');
  }

  const moonId = params.moonId === null || params.moonId === undefined ? null : params.moonId;
  if (moonId !== null && typeof moonId !== 'string') {
    return fail('Moon id must be a string or null');
  }

  // Site rules: moon buildings only on moons, planet buildings only on planets.
  if (definition.site === 'moon' && moonId === null) {
    return fail(`${definition.name} must be built on a moon`);
  }
  if (definition.site === 'planet' && moonId !== null) {
    return fail(`${definition.name} must be built on a planet surface`);
  }

  let parentEntity = planetEntity;
  if (moonId !== null) {
    const moonDefinition = planet.moons.find((moon) => moon.id === moonId);
    if (moonDefinition === undefined) {
      return fail('That moon does not orbit that planet');
    }
    parentEntity = resolveMoonEntity(moonId);
    if (parentEntity === 0) {
      return fail('Moon is not present in this match');
    }
    // Moons have exactly three slots (docs/Map_Design.md).
    const used = countBuildingsOnParent(world, parentEntity);
    if (used >= moonDefinition.buildingSlots) {
      return fail('That moon has no free building slots');
    }
  } else if (!hasSparePower(world, planetIndex, playerId, definition.power)) {
    // Planets have unlimited slots in the MVP; power is the real constraint.
    return fail('Not enough power on that planet - build a Power Plant');
  }

  const player = world.context.players.get(playerId);
  if (player === undefined) {
    return fail('Unknown player');
  }
  if (!hasResources(player.resources, definition.cost)) {
    return fail(`Not enough ${missingResource(player.resources, definition.cost) ?? 'resources'}`);
  }

  const position = allocatePosition(planetIndex, moonId);

  return ok({
    type: buildingType,
    planetIndex,
    moonId,
    cost: definition.cost,
    parentEntity,
    x: position.x,
    y: position.y,
    incomeMultiplier:
      planet.incomeBonus !== null && planet.incomeBonus.resource === definition.generates?.resource
        ? planet.incomeBonus.multiplier
        : 1,
  });
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
