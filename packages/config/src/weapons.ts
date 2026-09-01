/**
 * Weapon class reference data.
 *
 * Source: docs/Complete_Units_and_Buildings.md ("Weapon Types").
 *
 * These are the class-level defaults and visual descriptors. Actual per-mount
 * numbers live on each ship or building definition, because the docs override
 * the class ranges for almost every unit.
 */

import type { WeaponType } from '@fleet-strike/types';

/** Presentation and default data for a weapon class. */
export interface WeaponClass {
  readonly type: WeaponType;
  readonly name: string;
  readonly damageType: string;
  /** Class-default projectile speed; `0` means hitscan. */
  readonly projectileSpeed: number;
  /** Class-default range, used only as a fallback. */
  readonly range: number;
  /** Tint applied to the projectile sprite, as a PixiJS hex colour. */
  readonly color: number;
  /** Rendered projectile radius in world units. */
  readonly projectileRadius: number;
  /** Rendered trail length in world units, `0` for none. */
  readonly trailLength: number;
}

export const WEAPONS: Readonly<Record<WeaponType, WeaponClass>> = {
  laser: {
    type: 'laser',
    name: 'Laser',
    damageType: 'Energy',
    projectileSpeed: 0,
    range: 800,
    color: 0x67ddf7,
    projectileRadius: 2,
    trailLength: 0,
  },
  flak: {
    type: 'flak',
    name: 'Flak Cannon',
    damageType: 'Explosive Shrapnel',
    projectileSpeed: 400,
    range: 500,
    color: 0xffad32,
    projectileRadius: 3,
    trailLength: 10,
  },
  bullet: {
    type: 'bullet',
    name: 'Bullets',
    damageType: 'Kinetic',
    projectileSpeed: 250,
    range: 450,
    color: 0xfff06a,
    projectileRadius: 2,
    trailLength: 16,
  },
  rocket: {
    type: 'rocket',
    name: 'Rockets',
    damageType: 'Explosive',
    projectileSpeed: 150,
    range: 700,
    color: 0xff6a4f,
    projectileRadius: 4,
    trailLength: 28,
  },
  bomb: {
    type: 'bomb',
    name: 'Bombs',
    damageType: 'Explosive',
    projectileSpeed: 180,
    range: 500,
    color: 0xff4fff,
    projectileRadius: 5,
    trailLength: 12,
  },
  plasma: {
    type: 'plasma',
    name: 'Plasma',
    damageType: 'Energy',
    projectileSpeed: 450,
    range: 700,
    color: 0xc65cff,
    projectileRadius: 4,
    trailLength: 20,
  },
};

/** Stable numeric ids so projectiles can be serialised compactly. */
export const WEAPON_TYPE_IDS: Readonly<Record<WeaponType, number>> = {
  laser: 0,
  flak: 1,
  bullet: 2,
  rocket: 3,
  bomb: 4,
  plasma: 5,
};

/** Reverse lookup for `WEAPON_TYPE_IDS`. */
export const WEAPON_TYPE_BY_ID: readonly WeaponType[] = [
  'laser',
  'flak',
  'bullet',
  'rocket',
  'bomb',
  'plasma',
];

/** Rockets steer toward their target at this rate, in radians per second. */
export const ROCKET_TURN_RATE = Math.PI;
