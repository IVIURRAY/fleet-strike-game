/**
 * Weapon and armour taxonomy.
 *
 * Source: docs/Complete_Units_and_Buildings.md ("Weapon Types", "Armor Types",
 * "Balance Notes").
 */

export const WEAPON_TYPES = ['laser', 'flak', 'bullet', 'rocket', 'bomb', 'plasma'] as const;
export type WeaponType = (typeof WEAPON_TYPES)[number];

export const ARMOR_TYPES = ['light', 'medium', 'heavy', 'fortified'] as const;
export type ArmorType = (typeof ARMOR_TYPES)[number];

/**
 * A single weapon mount. Ships may carry several (e.g. the Heavy Gunship has
 * cannons plus a flak turret).
 */
export interface WeaponStats {
  /** Human readable mount name, e.g. "Dual Large Caliber Cannons". */
  readonly name: string;
  readonly weaponType: WeaponType;
  /** Damage applied per individual shot, before armour and modifiers. */
  readonly damage: number;
  /** Shots per second for this mount as a whole. */
  readonly rateOfFire: number;
  /** Maximum firing distance in world units. */
  readonly range: number;
  /**
   * Projectile travel speed in units/second. `0` means the shot is a hitscan
   * beam that resolves instantly (lasers).
   */
  readonly projectileSpeed: number;
  /** Splash radius in world units. `0` means single target. */
  readonly areaOfEffect: number;
  /** Seconds of wind-up before the first shot can be fired (Sniper charge). */
  readonly chargeTime: number;
}

/** True when the weapon resolves instantly rather than spawning a projectile. */
export function isHitscan(weapon: WeaponStats): boolean {
  return weapon.projectileSpeed <= 0;
}

/** Effective sustained damage of a single mount, ignoring armour. */
export function weaponDps(weapon: WeaponStats): number {
  return weapon.damage * weapon.rateOfFire;
}
