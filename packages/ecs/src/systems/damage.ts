/**
 * Damage application.
 *
 * Centralised here because the design docs assign armour mitigation to both
 * the collision system and the health system. Keeping it in one function
 * removes the ambiguity and guarantees damage is only ever mitigated once.
 *
 * Shields absorb damage before hull HP, and lasers get their documented +20%
 * bonus against shields.
 */

import { defineQuery, hasComponent } from 'bitecs';
import type { WeaponType } from '@fleet-strike/types';
import { ARMOR_TYPES } from '@fleet-strike/types';
import { LASER_SHIELD_MODIFIER, resolveDamage } from '@fleet-strike/config';

import { Active, Health, Shield } from '../components';
import type { GameWorld } from '../world';

/** Entities with a regenerating shield pool. */
const shieldQuery = defineQuery([Active, Shield, Health]);

/** Applies damage to an entity, returning the HP actually removed from its hull. */
export function applyDamage(
  world: GameWorld,
  target: number,
  rawDamage: number,
  weaponType: WeaponType
): number {
  if (rawDamage <= 0) return 0;
  if (!hasComponent(world, Health, target)) return 0;

  const currentHp = Health.current[target] as number;
  if (currentHp <= 0) return 0;

  Health.timeSinceDamage[target] = 0;

  let remaining = rawDamage;

  // Shields soak damage first and take it before armour mitigation, matching
  // the docs' description of a bubble that "blocks all projectiles".
  if (hasComponent(world, Shield, target)) {
    const shieldHp = Shield.current[target] as number;
    if (shieldHp > 0) {
      const shieldDamage =
        weaponType === 'laser' ? remaining * LASER_SHIELD_MODIFIER : remaining;
      if (shieldDamage <= shieldHp) {
        Shield.current[target] = shieldHp - shieldDamage;
        return 0;
      }
      // Shield breaks; the overflow carries through to the hull.
      Shield.current[target] = 0;
      remaining = (shieldDamage - shieldHp) / (weaponType === 'laser' ? LASER_SHIELD_MODIFIER : 1);
    }
  }

  const armorId = Health.armorId[target] as number;
  const armor = ARMOR_TYPES[armorId] ?? 'medium';
  const finalDamage = resolveDamage(remaining, weaponType, armor);

  const newHp = currentHp - finalDamage;
  Health.current[target] = newHp > 0 ? newHp : 0;

  return finalDamage;
}

/** Restores HP without exceeding the entity's maximum. */
export function applyHealing(world: GameWorld, target: number, amount: number): number {
  if (amount <= 0) return 0;
  if (!hasComponent(world, Health, target)) return 0;

  const current = Health.current[target] as number;
  // Destroyed entities cannot be repaired back to life.
  if (current <= 0) return 0;

  const max = Health.max[target] as number;
  const healed = Math.min(amount, max - current);
  Health.current[target] = current + healed;
  return healed;
}

/** Regenerates shields after the documented delay without taking damage. */
export function shieldRegenSystem(world: GameWorld, deltaTime: number): void {
  const entities = shieldQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const sinceDamage = (Health.timeSinceDamage[eid] as number) + deltaTime;
    Health.timeSinceDamage[eid] = sinceDamage;

    if (sinceDamage < (Shield.regenDelay[eid] as number)) continue;

    const max = Shield.max[eid] as number;
    const current = Shield.current[eid] as number;
    if (current >= max) continue;

    const regenerated = current + (Shield.regenRate[eid] as number) * deltaTime;
    Shield.current[eid] = regenerated > max ? max : regenerated;
  }
}
