/**
 * Interpolation and easing helpers, used mainly by the client to smooth
 * server updates and by the camera.
 */

import { clamp } from './vector';

/** Interpolates between two 2D points, writing into `target`. */
export function lerpVectorInto(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  t: number,
  target: { x: number; y: number }
): void {
  target.x = fromX + (toX - fromX) * t;
  target.y = fromY + (toY - fromY) * t;
}

/**
 * Frame-rate independent exponential smoothing.
 *
 * `smoothing` is the fraction of the remaining distance covered per second.
 */
export function damp(
  current: number,
  target: number,
  smoothing: number,
  deltaTime: number
): number {
  const t = 1 - Math.exp(-smoothing * deltaTime);
  return current + (target - current) * t;
}

/** Interpolates an angle along the shortest arc. */
export function lerpAngle(from: number, to: number, t: number): number {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

/** Maps `value` from one range to another, clamping to the output range. */
export function remap(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  if (fromMax === fromMin) return toMin;
  const t = clamp((value - fromMin) / (fromMax - fromMin), 0, 1);
  return toMin + (toMax - toMin) * t;
}

/** Smoothstep easing over the range `[0, 1]`. */
export function smoothStep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Quadratic ease-out, used for explosion scaling. */
export function easeOutQuad(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - (1 - x) * (1 - x);
}
