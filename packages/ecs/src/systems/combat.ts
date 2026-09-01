/**
 * Combat system — fires weapons at acquired targets.
 *
 * Handles both ships and turrets: the only difference is that turrets do not
 * move, which this system does not care about. Hitscan weapons (lasers) resolve
 * damage immediately; everything else spawns a projectile.
 */

import { hasComponent } from 'bitecs';
import type { PlayerId, WeaponType } from '@fleet-strike/types';
import { WEAPONS, WEAPON_TYPE_BY_ID } from '@fleet-strike/config';
import { distance } from '@fleet-strike/utils';

import { Active, Health, Owner, Position, Rotation, Targeting, Velocity, Weapons } from '../components';
import { weaponQuery } from '../queries';
import { createProjectile } from '../entities/projectile';
import { emitEvent } from '../world';
import type { GameWorld } from '../world';
import { applyDamage } from './damage';

/** Advances weapon cooldowns and fires anything that is ready and in range. */
export function combatSystem(world: GameWorld, deltaTime: number): void {
  const entities = weaponQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const mountCount = Weapons.count[eid] as number;
    const target = Targeting.target[eid] as number;

    const hasValidTarget =
      target !== 0 && hasComponent(world, Active, target) && (Health.current[target] as number) > 0;

    const x = Position.x[eid] as number;
    const y = Position.y[eid] as number;

    for (let mount = 0; mount < mountCount; mount += 1) {
      const cooldown = (Weapons.cooldown[eid]![mount] as number) - deltaTime;

      if (!hasValidTarget) {
        // Cooldowns still tick down without a target so a ship that reacquires
        // one can fire immediately.
        Weapons.cooldown[eid]![mount] = cooldown > 0 ? cooldown : 0;
        continue;
      }

      if (cooldown > 0) {
        Weapons.cooldown[eid]![mount] = cooldown;
        continue;
      }

      const targetX = Position.x[target] as number;
      const targetY = Position.y[target] as number;
      const range = Weapons.range[eid]![mount] as number;

      if (distance(x, y, targetX, targetY) > range) {
        // Out of range for this mount: hold fire but stay ready.
        Weapons.cooldown[eid]![mount] = 0;
        continue;
      }

      fireMount(world, eid, mount, target, x, y, targetX, targetY);

      const rateOfFire = Weapons.rateOfFire[eid]![mount] as number;
      Weapons.cooldown[eid]![mount] = rateOfFire > 0 ? 1 / rateOfFire : 1;
    }
  }
}

function fireMount(
  world: GameWorld,
  eid: number,
  mount: number,
  target: number,
  x: number,
  y: number,
  targetX: number,
  targetY: number
): void {
  const weaponId = Weapons.weaponId[eid]![mount] as number;
  const weaponType = WEAPON_TYPE_BY_ID[weaponId] ?? 'bullet';
  const damage = Weapons.damage[eid]![mount] as number;
  const areaOfEffect = Weapons.areaOfEffect[eid]![mount] as number;
  const projectileSpeed = Weapons.projectileSpeed[eid]![mount] as number;
  const owner = Owner.playerId[eid] as PlayerId;

  const angle = Math.atan2(targetY - y, targetX - x);

  emitEvent(world, {
    type: 'WEAPON_FIRED',
    x,
    y,
    rotation: angle,
    weaponType,
    isHitscan: projectileSpeed <= 0,
    targetX,
    targetY,
  });

  if (projectileSpeed <= 0) {
    // Hitscan: resolve immediately against the acquired target.
    applyDamage(world, target, damage, weaponType);
    return;
  }

  // Lead the target for unguided munitions so slow projectiles can still
  // connect with fast ships.
  const aimAngle = shouldHome(weaponType)
    ? angle
    : leadTarget(x, y, targetX, targetY, target, projectileSpeed);

  createProjectile(world, {
    owner,
    weaponType,
    x,
    y,
    damage,
    areaOfEffect,
    speed: projectileSpeed,
    angle: aimAngle,
    source: eid,
    target: shouldHome(weaponType) ? target : 0,
    isHoming: shouldHome(weaponType),
    radius: WEAPONS[weaponType].projectileRadius,
  });

  // Turrets and ships both point at what they are shooting.
  if (hasComponent(world, Rotation, eid)) {
    Rotation.angle[eid] = angle;
  }
}

/** Rockets and missiles track their target; everything else flies straight. */
function shouldHome(weaponType: WeaponType): boolean {
  return weaponType === 'rocket';
}

/**
 * Computes a firing angle that intercepts a moving target.
 *
 * Uses a single iteration of the standard intercept estimate, which is ample
 * given projectile speeds are much higher than ship speeds.
 */
function leadTarget(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  target: number,
  projectileSpeed: number
): number {
  const travelTime = distance(x, y, targetX, targetY) / projectileSpeed;
  const predictedX = targetX + velocityX(target) * travelTime;
  const predictedY = targetY + velocityY(target) * travelTime;
  return Math.atan2(predictedY - y, predictedX - x);
}

/** Reads a target's velocity, defaulting to zero for static structures. */
function velocityX(entity: number): number {
  return Velocity.dx[entity] ?? 0;
}

function velocityY(entity: number): number {
  return Velocity.dy[entity] ?? 0;
}
