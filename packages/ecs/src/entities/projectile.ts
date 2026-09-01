/**
 * Projectile entity construction, with pooling.
 *
 * Projectiles are the highest-churn entity in the game — the docs project
 * 500-1000 in flight during a major battle — so ids are recycled through a
 * free list rather than allocated per shot.
 */

import { addComponent, addEntity, removeComponent } from 'bitecs';
import type { PlayerId, WeaponType } from '@fleet-strike/types';
import { PROJECTILE_LIFETIME, WEAPON_TYPE_IDS } from '@fleet-strike/config';

import {
  Active,
  Collider,
  Lifetime,
  Owner,
  Position,
  Projectile,
  ProjectileTag,
  Rotation,
  Velocity,
} from '../components';
import type { GameWorld } from '../world';

/** Free list of recyclable projectile entity ids, keyed per world. */
const pools = new WeakMap<GameWorld, number[]>();

/** Parameters for spawning a projectile. */
export interface CreateProjectileParams {
  readonly owner: PlayerId;
  readonly weaponType: WeaponType;
  readonly x: number;
  readonly y: number;
  readonly damage: number;
  readonly areaOfEffect: number;
  readonly speed: number;
  readonly angle: number;
  readonly source: number;
  /** Homing target, or `0` for an unguided munition. */
  readonly target: number;
  readonly isHoming: boolean;
  readonly radius: number;
}

/** Spawns a projectile, reusing a pooled entity id when one is available. */
export function createProjectile(world: GameWorld, params: CreateProjectileParams): number {
  const entity = acquireEntity(world);

  addComponent(world, ProjectileTag, entity);
  addComponent(world, Active, entity);

  addComponent(world, Position, entity);
  Position.x[entity] = params.x;
  Position.y[entity] = params.y;

  addComponent(world, Velocity, entity);
  Velocity.dx[entity] = Math.cos(params.angle) * params.speed;
  Velocity.dy[entity] = Math.sin(params.angle) * params.speed;
  Velocity.maxSpeed[entity] = params.speed;
  Velocity.minSpeed[entity] = params.speed;

  addComponent(world, Rotation, entity);
  Rotation.angle[entity] = params.angle;
  Rotation.turnRate[entity] = 0;

  addComponent(world, Collider, entity);
  Collider.radius[entity] = params.radius;

  addComponent(world, Owner, entity);
  Owner.playerId[entity] = params.owner;

  addComponent(world, Projectile, entity);
  Projectile.weaponId[entity] = WEAPON_TYPE_IDS[params.weaponType];
  Projectile.damage[entity] = params.damage;
  Projectile.areaOfEffect[entity] = params.areaOfEffect;
  Projectile.source[entity] = params.source;
  Projectile.target[entity] = params.target;
  Projectile.isHoming[entity] = params.isHoming ? 1 : 0;

  addComponent(world, Lifetime, entity);
  Lifetime.remaining[entity] = PROJECTILE_LIFETIME;

  return entity;
}

/**
 * Returns a projectile entity to the pool.
 *
 * The entity is deactivated rather than deleted so its id stays stable and
 * bitECS does not have to compact its internal storage.
 */
export function recycleProjectile(world: GameWorld, entity: number): void {
  removeComponent(world, Active, entity);
  const pool = pools.get(world);
  if (pool === undefined) {
    pools.set(world, [entity]);
    return;
  }
  pool.push(entity);
}

/** Number of pooled projectile ids awaiting reuse. */
export function pooledProjectileCount(world: GameWorld): number {
  return pools.get(world)?.length ?? 0;
}

function acquireEntity(world: GameWorld): number {
  const pool = pools.get(world);
  // A plain `pool.pop() || addEntity()` would misbehave for entity id 0, so
  // the length is checked explicitly.
  if (pool !== undefined && pool.length > 0) {
    return pool.pop() as number;
  }
  return addEntity(world);
}
