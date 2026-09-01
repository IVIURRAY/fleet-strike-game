/**
 * Building placement validation.
 *
 * Checks, in order: the building type exists, the planet index is real, the
 * player controls the planet, the site accepts this building class, moon slot
 * limits are respected, the planet has spare power, and the player can pay.
 */

import type { BuildingType, PlayerId, ResourceCost } from '@fleet-strike/types';
import { BUILDINGS, PLANETS } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import { Owner } from '@fleet-strike/ecs';
import { hasResources, missingResource } from '@fleet-strike/utils';

import { countBuildingsOnParent, fail, hasSparePower, ok } from './shared';
import type { ValidationResult } from './shared';

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
  readonly allocatePosition: (
    planetIndex: number,
    moonId: string | null
  ) => { x: number; y: number };
}

/** Validates a build command. */
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
