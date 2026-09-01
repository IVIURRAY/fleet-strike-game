/**
 * Damage resolution tables.
 *
 * Source: docs/Complete_Units_and_Buildings.md ("Armor Types", "Balance Notes").
 */

import type { ArmorType, WeaponType } from '@fleet-strike/types';

/**
 * Fractional damage reduction per armour class.
 *
 * The docs give ranges rather than exact values (Light 0-10%, Medium 15-25%,
 * Heavy 30-50%, Fortified 60-75%). The midpoints are used, except for Light
 * which is pinned to 5% because the documented Scout prefab hard-codes
 * `armorValue: 5`.
 */
export const ARMOR_DAMAGE_REDUCTION: Readonly<Record<ArmorType, number>> = {
  light: 0.05,
  medium: 0.2,
  heavy: 0.4,
  fortified: 0.65,
};

/**
 * Weapon effectiveness multipliers against each armour class.
 *
 * Only five modifiers are specified in the docs; every unspecified pairing is
 * 1.0 rather than an invented value.
 *
 * - Flak: +30% vs Light
 * - Rockets: +20% vs Heavy, -10% vs Light
 * - Lasers: +0% vs all armour (their bonus applies to shields only)
 * - Bullets: baseline
 */
export const WEAPON_ARMOR_MODIFIERS: Readonly<
  Record<WeaponType, Readonly<Record<ArmorType, number>>>
> = {
  laser: { light: 1, medium: 1, heavy: 1, fortified: 1 },
  flak: { light: 1.3, medium: 1, heavy: 1, fortified: 1 },
  bullet: { light: 1, medium: 1, heavy: 1, fortified: 1 },
  rocket: { light: 0.9, medium: 1, heavy: 1.2, fortified: 1 },
  bomb: { light: 1, medium: 1, heavy: 1, fortified: 1 },
  plasma: { light: 1, medium: 1, heavy: 1, fortified: 1 },
};

/** Bonus multiplier lasers receive against shield pools. */
export const LASER_SHIELD_MODIFIER = 1.2;

/**
 * Resolves final damage for one hit.
 *
 * Weapon-versus-armour modifiers are applied first, then flat armour
 * reduction. The docs describe both steps but never fix their order; applying
 * the multiplier before mitigation keeps armour meaningful against
 * specialised weapons.
 */
export function resolveDamage(rawDamage: number, weapon: WeaponType, armor: ArmorType): number {
  const modifier = WEAPON_ARMOR_MODIFIERS[weapon][armor];
  const reduction = ARMOR_DAMAGE_REDUCTION[armor];
  const damage = rawDamage * modifier * (1 - reduction);
  return damage > 0 ? damage : 0;
}
