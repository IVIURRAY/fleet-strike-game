/**
 * Combat components: health, weapons, targeting and shields.
 *
 * Ships may carry up to `MAX_WEAPON_MOUNTS` weapons, so weapon fields are
 * fixed-size arrays rather than scalars. bitECS supports array fields via the
 * `[Types.f32, length]` tuple form.
 */

import { Types, defineComponent } from 'bitecs';

/** Maximum simultaneous weapon mounts on a single entity. */
export const MAX_WEAPON_MOUNTS = 2;

/** Hit points and damage mitigation. */
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
  /** `ARMOR_TYPES` index. */
  armorId: Types.ui8,
  /** Seconds since this entity last took damage, for shield regeneration. */
  timeSinceDamage: Types.f32,
});

/**
 * Weapon mounts. Index `i` across every field describes one mount, and
 * `count` says how many are populated.
 */
export const Weapons = defineComponent({
  count: Types.ui8,
  /** `WEAPON_TYPE_IDS` value per mount. */
  weaponId: [Types.ui8, MAX_WEAPON_MOUNTS],
  damage: [Types.f32, MAX_WEAPON_MOUNTS],
  /** Shots per second. */
  rateOfFire: [Types.f32, MAX_WEAPON_MOUNTS],
  range: [Types.f32, MAX_WEAPON_MOUNTS],
  /** `0` marks a hitscan beam. */
  projectileSpeed: [Types.f32, MAX_WEAPON_MOUNTS],
  areaOfEffect: [Types.f32, MAX_WEAPON_MOUNTS],
  /** Seconds of wind-up before the first shot. */
  chargeTime: [Types.f32, MAX_WEAPON_MOUNTS],
  /** Seconds remaining before this mount may fire again. */
  cooldown: [Types.f32, MAX_WEAPON_MOUNTS],
});

/** Current target selection. */
export const Targeting = defineComponent({
  /** `0` means no target. */
  target: Types.eid,
  /** How far this entity can acquire a target. */
  detectionRange: Types.f32,
  /** Seconds until the next re-evaluation. */
  cooldown: Types.f32,
});

/** Regenerating shield pool projected by shield generators. */
export const Shield = defineComponent({
  current: Types.f32,
  max: Types.f32,
  regenRate: Types.f32,
  regenDelay: Types.f32,
});

/** Payload carried by an in-flight projectile. */
export const Projectile = defineComponent({
  /** `WEAPON_TYPE_IDS` value. */
  weaponId: Types.ui8,
  damage: Types.f32,
  areaOfEffect: Types.f32,
  /** Entity that fired the shot, for kill attribution. */
  source: Types.eid,
  /** Homing target for rockets; `0` for unguided munitions. */
  target: Types.eid,
  /** Whether this munition steers toward its target. */
  isHoming: Types.ui8,
});

/** Countdown to automatic destruction. */
export const Lifetime = defineComponent({
  remaining: Types.f32,
});

/** Repair beam emitted by Medics and Repair Stations. */
export const Repairer = defineComponent({
  /** HP restored per second per target. */
  perSecond: Types.f32,
  /** How many allies can be serviced at once. */
  targets: Types.ui8,
  range: Types.f32,
});
