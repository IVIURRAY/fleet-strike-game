/**
 * Projectile guidance and collision.
 *
 * Collision uses a swept segment-versus-circle test against the projectile's
 * path this tick. A point-in-circle test would let a 450 u/s plasma bolt skip
 * straight over a 5-unit Scout hitbox at 60 Hz.
 */

import { hasComponent } from 'bitecs';
import type { WeaponType } from '@fleet-strike/types';
import { ROCKET_TURN_RATE, WEAPON_TYPE_BY_ID } from '@fleet-strike/config';
import { rotateToward, segmentIntersectsCircle } from '@fleet-strike/utils';

import {
  Active,
  Collider,
  Health,
  Owner,
  Position,
  Projectile,
  Rotation,
  Velocity,
} from '../components';
import { projectileQuery } from '../queries';
import { recycleProjectile } from '../entities/projectile';
import { emitEvent } from '../world';
import type { GameWorld } from '../world';
import { applyDamage } from './damage';

/** Steers homing munitions toward their target. */
export function projectileGuidanceSystem(world: GameWorld, deltaTime: number): void {
  const entities = projectileQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    if ((Projectile.isHoming[eid] as number) === 0) continue;

    const target = Projectile.target[eid] as number;
    if (target === 0 || !hasComponent(world, Active, target)) {
      // Lost lock: the rocket continues on its current heading.
      Projectile.isHoming[eid] = 0;
      continue;
    }

    const x = Position.x[eid] as number;
    const y = Position.y[eid] as number;
    const desired = Math.atan2(
      (Position.y[target] as number) - y,
      (Position.x[target] as number) - x
    );

    const angle = rotateToward(
      Rotation.angle[eid] as number,
      desired,
      ROCKET_TURN_RATE * deltaTime
    );
    Rotation.angle[eid] = angle;

    const speed = Velocity.maxSpeed[eid] as number;
    Velocity.dx[eid] = Math.cos(angle) * speed;
    Velocity.dy[eid] = Math.sin(angle) * speed;
  }
}

/**
 * Resolves projectile impacts.
 *
 * Must run after `movementSystem`, and is given the projectile's previous
 * position so the swept test covers the whole step.
 */
export function projectileCollisionSystem(world: GameWorld, deltaTime: number): void {
  const entities = projectileQuery(world);
  const { shipGrid, structureGrid } = world.context;

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;

    const toX = Position.x[eid] as number;
    const toY = Position.y[eid] as number;
    // Reconstruct where the projectile was before this tick's integration.
    const fromX = toX - (Velocity.dx[eid] as number) * deltaTime;
    const fromY = toY - (Velocity.dy[eid] as number) * deltaTime;

    const owner = Owner.playerId[eid] as number;
    const projectileRadius = Collider.radius[eid] as number;

    // Search around the midpoint of the swept path, with a radius covering it.
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const halfLength = Math.hypot(toX - fromX, toY - fromY) / 2;
    const searchRadius = halfLength + projectileRadius + MAX_TARGET_RADIUS;

    const hit =
      findHit(shipGrid.query(midX, midY, searchRadius), owner, fromX, fromY, toX, toY, projectileRadius) ||
      findHit(
        structureGrid.query(midX, midY, searchRadius),
        owner,
        fromX,
        fromY,
        toX,
        toY,
        projectileRadius
      );

    if (hit === 0) continue;

    resolveImpact(world, eid, hit, toX, toY);
  }
}

/** Largest hitbox on the map, used to size the broad-phase search. */
const MAX_TARGET_RADIUS = 40;

function findHit(
  candidates: readonly number[],
  owner: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  projectileRadius: number
): number {
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i] as number;
    if ((Owner.playerId[candidate] as number) === owner) continue;
    if ((Health.current[candidate] as number) <= 0) continue;

    const radius = (Collider.radius[candidate] as number) + projectileRadius;
    if (
      segmentIntersectsCircle(
        fromX,
        fromY,
        toX,
        toY,
        Position.x[candidate] as number,
        Position.y[candidate] as number,
        radius
      )
    ) {
      return candidate;
    }
  }
  return 0;
}

/** Applies damage, splash and effects, then recycles the projectile. */
function resolveImpact(
  world: GameWorld,
  projectile: number,
  target: number,
  x: number,
  y: number
): void {
  const weaponId = Projectile.weaponId[projectile] as number;
  const weaponType = WEAPON_TYPE_BY_ID[weaponId] ?? 'bullet';
  const damage = Projectile.damage[projectile] as number;
  const splash = Projectile.areaOfEffect[projectile] as number;
  const owner = Owner.playerId[projectile] as number;

  if (splash > 0) {
    applySplash(world, x, y, splash, damage, weaponType, owner);
  } else {
    applyDamage(world, target, damage, weaponType);
  }

  emitEvent(world, {
    type: 'ENTITY_DESTROYED',
    entityId: projectile,
    x,
    y,
    scale: splash > 0 ? splash / 40 : 1,
  });

  recycleProjectile(world, projectile);
}

/** Damages every hostile entity inside the blast radius. */
function applySplash(
  world: GameWorld,
  x: number,
  y: number,
  radius: number,
  damage: number,
  weaponType: WeaponType,
  owner: number
): void {
  const { shipGrid, structureGrid } = world.context;

  damageInRadius(world, shipGrid.query(x, y, radius), x, y, radius, damage, weaponType, owner);
  damageInRadius(
    world,
    structureGrid.query(x, y, radius),
    x,
    y,
    radius,
    damage,
    weaponType,
    owner
  );
}

function damageInRadius(
  world: GameWorld,
  candidates: readonly number[],
  x: number,
  y: number,
  radius: number,
  damage: number,
  weaponType: WeaponType,
  owner: number
): void {
  const radiusSquared = radius * radius;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i] as number;
    if ((Owner.playerId[candidate] as number) === owner) continue;

    const dx = (Position.x[candidate] as number) - x;
    const dy = (Position.y[candidate] as number) - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared > radiusSquared) continue;

    // Linear falloff from full damage at the centre to half at the edge.
    const falloff = 1 - 0.5 * (Math.sqrt(distanceSquared) / radius);
    applyDamage(world, candidate, damage * falloff, weaponType);
  }
}
