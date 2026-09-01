/**
 * Transform components: position, velocity and rotation.
 *
 * Source: docs/ECS_game_design_system.md ("Component Catalog"). The doc
 * describes components as plain object shapes, but bitECS stores
 * Structure-of-Arrays typed arrays, so each field becomes its own typed array
 * indexed by entity id.
 */

import { Types, defineComponent } from 'bitecs';

/** World-space location. */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

/** Linear velocity in units per second, plus the entity's speed envelope. */
export const Velocity = defineComponent({
  dx: Types.f32,
  dy: Types.f32,
  maxSpeed: Types.f32,
  minSpeed: Types.f32,
});

/** Facing direction and how fast it may change. */
export const Rotation = defineComponent({
  /** Current heading in radians. */
  angle: Types.f32,
  /** Maximum turn rate in radians per second. */
  turnRate: Types.f32,
});

/** Circular collision bounds. */
export const Collider = defineComponent({
  radius: Types.f32,
});

/**
 * Orbital motion around a parent entity, used by moons.
 */
export const Orbital = defineComponent({
  parent: Types.eid,
  radius: Types.f32,
  /** Radians per second. */
  speed: Types.f32,
  angle: Types.f32,
});
