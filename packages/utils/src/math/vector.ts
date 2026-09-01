/**
 * 2D vector mathematics.
 *
 * Functions are written to avoid allocation where practical: the `*Into`
 * variants write into a caller-supplied target so hot paths such as steering
 * and collision produce no garbage.
 */

import type { MutableVector2, Vector2 } from '@fleet-strike/types';

/** Squared distance between two points. Preferred for comparisons. */
export function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

/** Euclidean distance between two points. */
export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt(distanceSquared(ax, ay, bx, by));
}

/** Length of a vector. */
export function magnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

/** Squared length of a vector. */
export function magnitudeSquared(x: number, y: number): number {
  return x * x + y * y;
}

/**
 * Normalises `(x, y)` into `target`. A zero-length input yields `(0, 0)`
 * rather than NaN.
 */
export function normalizeInto(x: number, y: number, target: MutableVector2): MutableVector2 {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) {
    target.x = 0;
    target.y = 0;
    return target;
  }
  target.x = x / length;
  target.y = y / length;
  return target;
}

/** Allocating form of `normalizeInto`. */
export function normalize(x: number, y: number): Vector2 {
  return normalizeInto(x, y, { x: 0, y: 0 });
}

/** Scales a vector so its length does not exceed `max`. */
export function clampMagnitudeInto(
  x: number,
  y: number,
  max: number,
  target: MutableVector2
): MutableVector2 {
  const lengthSquared = x * x + y * y;
  if (lengthSquared <= max * max || lengthSquared === 0) {
    target.x = x;
    target.y = y;
    return target;
  }
  const scale = max / Math.sqrt(lengthSquared);
  target.x = x * scale;
  target.y = y * scale;
  return target;
}

/** Linear interpolation between two scalars. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Constrains `value` to the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** Dot product of two vectors. */
export function dot(ax: number, ay: number, bx: number, by: number): number {
  return ax * bx + ay * by;
}

/** Angle of a vector in radians, measured from the positive x axis. */
export function angleOf(x: number, y: number): number {
  return Math.atan2(y, x);
}

/** Wraps an angle into the range `(-PI, PI]`. */
export function wrapAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let wrapped = angle % twoPi;
  if (wrapped > Math.PI) wrapped -= twoPi;
  if (wrapped <= -Math.PI) wrapped += twoPi;
  return wrapped;
}

/** Shortest signed angular difference from `from` to `to`. */
export function angleDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

/**
 * Rotates `current` toward `target` by at most `maxDelta` radians.
 * Used to enforce ship turn rates.
 */
export function rotateToward(current: number, target: number, maxDelta: number): number {
  const delta = angleDelta(current, target);
  if (Math.abs(delta) <= maxDelta) return wrapAngle(target);
  return wrapAngle(current + Math.sign(delta) * maxDelta);
}

/** Converts degrees to radians. */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Converts radians to degrees. */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
