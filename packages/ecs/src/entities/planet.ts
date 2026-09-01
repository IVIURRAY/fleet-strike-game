/**
 * Planet and moon entity construction.
 */

import { addComponent, addEntity } from 'bitecs';
import type { MoonDefinition, PlanetDefinition } from '@fleet-strike/types';
import { CAPTURE_RADIUS, CAPTURE_THRESHOLD } from '@fleet-strike/config';

import {
  Active,
  Capturable,
  Collider,
  MoonTag,
  Orbital,
  Owner,
  Parent,
  PlanetRef,
  PlanetTag,
  Position,
} from '../components';
import type { GameWorld } from '../world';

/** Creates a planet entity from its static definition. */
export function createPlanet(world: GameWorld, definition: PlanetDefinition): number {
  const entity = addEntity(world);

  addComponent(world, PlanetTag, entity);
  addComponent(world, Active, entity);

  addComponent(world, Position, entity);
  Position.x[entity] = definition.x;
  Position.y[entity] = definition.y;

  addComponent(world, Collider, entity);
  Collider.radius[entity] = definition.radius;

  addComponent(world, Owner, entity);
  Owner.playerId[entity] = definition.initialOwner;

  addComponent(world, PlanetRef, entity);
  PlanetRef.index[entity] = definition.index;

  addComponent(world, Capturable, entity);
  // A capital starts fully held by its owner so it cannot be flipped instantly.
  Capturable.progress[entity] =
    definition.initialOwner === 1
      ? -CAPTURE_THRESHOLD
      : definition.initialOwner === 2
        ? CAPTURE_THRESHOLD
        : 0;
  Capturable.radius[entity] = CAPTURE_RADIUS;
  Capturable.presenceP1[entity] = 0;
  Capturable.presenceP2[entity] = 0;

  return entity;
}

/** Creates a moon entity orbiting an already-created planet. */
export function createMoon(
  world: GameWorld,
  definition: MoonDefinition,
  planetEntity: number,
  planet: PlanetDefinition
): number {
  const entity = addEntity(world);

  addComponent(world, MoonTag, entity);
  addComponent(world, Active, entity);

  addComponent(world, Orbital, entity);
  Orbital.parent[entity] = planetEntity;
  Orbital.radius[entity] = definition.orbitRadius;
  Orbital.speed[entity] = definition.orbitSpeed;
  Orbital.angle[entity] = definition.initialAngle;

  addComponent(world, Position, entity);
  Position.x[entity] = planet.x + Math.cos(definition.initialAngle) * definition.orbitRadius;
  Position.y[entity] = planet.y + Math.sin(definition.initialAngle) * definition.orbitRadius;

  addComponent(world, Collider, entity);
  Collider.radius[entity] = definition.radius;

  // Moons inherit ownership from their parent planet.
  addComponent(world, Owner, entity);
  Owner.playerId[entity] = planet.initialOwner;

  addComponent(world, PlanetRef, entity);
  PlanetRef.index[entity] = definition.planetIndex;

  addComponent(world, Parent, entity);
  Parent.entity[entity] = planetEntity;

  return entity;
}
