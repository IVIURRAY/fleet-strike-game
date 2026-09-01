/**
 * Movement, production and capture components.
 */

import { Types, defineComponent } from 'bitecs';

/**
 * Waypoint following. The destination is stored directly rather than as an
 * entity reference so a ship needs no lookup to steer, and so the MVP's
 * single-waypoint-per-player rule stays trivially cheap.
 */
export const WaypointFollower = defineComponent({
  targetX: Types.f32,
  targetY: Types.f32,
  /** Set once the ship is loitering within range of the waypoint. */
  arrived: Types.ui8,
  /** Per-ship angular offset so a fleet spreads out while loitering. */
  loiterPhase: Types.f32,
});

/** Factory production timer. */
export const Production = defineComponent({
  /** `SHIP_TYPE_IDS` value produced. */
  shipTypeId: Types.ui8,
  /** Seconds between completed units at the current level. */
  interval: Types.f32,
  /** Seconds until the next unit completes. */
  remaining: Types.f32,
  /** `0` while blocked by resources or an enemy capture. */
  active: Types.ui8,
  /** Set when production is paused for want of resources. */
  stalled: Types.ui8,
});

/** Continuous resource output. */
export const ResourceGenerator = defineComponent({
  /** `RESOURCES` index. */
  resourceId: Types.ui8,
  perSecond: Types.f32,
  /** Multiplier from planet bonuses, e.g. 1.5 on the Gold Planet. */
  multiplier: Types.f32,
});

/** Construction progress for a structure that is still being built. */
export const UnderConstruction = defineComponent({
  remaining: Types.f32,
  total: Types.f32,
});

/** Tug-of-war capture state on a planet. */
export const Capturable = defineComponent({
  /** Signed progress in [-CAPTURE_THRESHOLD, +CAPTURE_THRESHOLD]. */
  progress: Types.f32,
  radius: Types.f32,
  /** Ships inside the radius, per player, for HUD display. */
  presenceP1: Types.ui16,
  presenceP2: Types.ui16,
});

/** Capture points a ship contributes per second. */
export const CaptureContributor = defineComponent({
  rate: Types.f32,
});

/** Passive support aura projected by a structure. */
export const SupportAura = defineComponent({
  radius: Types.f32,
  repairPerSecond: Types.f32,
});

/** Vision granted to the owning player. */
export const Vision = defineComponent({
  radius: Types.f32,
});
