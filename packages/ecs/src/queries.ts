/**
 * Shared bitECS queries.
 *
 * Queries are defined once at module scope. Defining them inside a system, as
 * the design docs' example does, rebuilds the query every frame and defeats
 * bitECS's caching.
 */

import { defineQuery } from 'bitecs';

import {
  Active,
  BuildingTag,
  Capturable,
  CaptureContributor,
  Health,
  Lifetime,
  MoonTag,
  Orbital,
  Owner,
  PlanetTag,
  Position,
  Production,
  Projectile,
  ProjectileTag,
  Repairer,
  ResourceGenerator,
  Rotation,
  ShipTag,
  SupportAura,
  Targeting,
  UnderConstruction,
  Velocity,
  WaypointFollower,
  Weapons,
} from './components';

/** Every live ship. */
export const shipQuery = defineQuery([ShipTag, Active, Position, Velocity, Owner]);

/** Ships steering toward their owner's waypoint. */
export const waypointQuery = defineQuery([
  ShipTag,
  Active,
  Position,
  Velocity,
  Rotation,
  WaypointFollower,
]);

/** Entities that acquire targets: ships and turrets. */
export const targetingQuery = defineQuery([Active, Position, Owner, Targeting, Weapons]);

/** Entities that can fire this tick. */
export const weaponQuery = defineQuery([Active, Position, Owner, Weapons, Targeting]);

/** Live projectiles. */
export const projectileQuery = defineQuery([
  ProjectileTag,
  Active,
  Position,
  Velocity,
  Projectile,
  Owner,
]);

/** Anything that can take damage. */
export const damageableQuery = defineQuery([Active, Position, Health, Owner]);

/** Entities with a finite lifespan. */
export const lifetimeQuery = defineQuery([Active, Lifetime]);

/** Moons, which orbit their parent planet. */
export const orbitalQuery = defineQuery([MoonTag, Active, Position, Orbital]);

/** The seven main planets. */
export const planetQuery = defineQuery([PlanetTag, Active, Position, Capturable]);

/** Ships that contribute capture points. */
export const captureQuery = defineQuery([ShipTag, Active, Position, Owner, CaptureContributor]);

/** Factories with a production timer. */
export const productionQuery = defineQuery([BuildingTag, Active, Production, Owner, Position]);

/** Economy buildings. */
export const resourceQuery = defineQuery([BuildingTag, Active, ResourceGenerator, Owner]);

/** Structures still being built. */
export const constructionQuery = defineQuery([Active, UnderConstruction]);

/** Support structures projecting a repair aura. */
export const auraQuery = defineQuery([Active, Position, Owner, SupportAura]);

/** Ships carrying a repair beam. */
export const repairerQuery = defineQuery([ShipTag, Active, Position, Owner, Repairer]);

/** Every live building. */
export const buildingQuery = defineQuery([BuildingTag, Active, Position, Owner]);
