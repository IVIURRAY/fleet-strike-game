/**
 * Collision geometry.
 *
 * Projectiles move far enough per tick that a naive point-in-circle test would
 * tunnel through small targets, so the segment tests below are swept rather
 * than instantaneous.
 */

import { distanceSquared } from './vector';

/** True when a point lies inside a circle. */
export function isPointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return distanceSquared(px, py, cx, cy) <= radius * radius;
}

/** True when two circles overlap. */
export function circlesOverlap(
  ax: number,
  ay: number,
  aRadius: number,
  bx: number,
  by: number,
  bRadius: number
): boolean {
  const combined = aRadius + bRadius;
  return distanceSquared(ax, ay, bx, by) <= combined * combined;
}

/**
 * Squared distance from a point to the closest position on a line segment.
 * The workhorse of swept collision.
 */
export function pointToSegmentDistanceSquared(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared === 0) return distanceSquared(px, py, ax, ay);

  let t = ((px - ax) * abx + (py - ay) * aby) / lengthSquared;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;

  const closestX = ax + abx * t;
  const closestY = ay + aby * t;
  return distanceSquared(px, py, closestX, closestY);
}

/**
 * True when the swept path of a moving point from `(ax, ay)` to `(bx, by)`
 * intersects a circle. Prevents fast projectiles tunnelling through ships.
 */
export function segmentIntersectsCircle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return pointToSegmentDistanceSquared(cx, cy, ax, ay, bx, by) <= radius * radius;
}

/** True when a point lies inside an axis-aligned rectangle. */
export function isPointInRect(
  px: number,
  py: number,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return px >= x && px <= x + width && py >= y && py <= y + height;
}

/** True when a circle intersects an axis-aligned rectangle. */
export function circleIntersectsRect(
  cx: number,
  cy: number,
  radius: number,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const closestX = cx < x ? x : cx > x + width ? x + width : cx;
  const closestY = cy < y ? y : cy > y + height ? y + height : cy;
  return distanceSquared(cx, cy, closestX, closestY) <= radius * radius;
}
