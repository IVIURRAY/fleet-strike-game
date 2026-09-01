/**
 * World boundary checks.
 */

import { WORLD_HEIGHT, WORLD_WIDTH } from '@fleet-strike/config';

/** True when a position lies inside the playable area. */
export function isWithinWorld(x: number, y: number): boolean {
  return x >= 0 && x <= WORLD_WIDTH && y >= 0 && y <= WORLD_HEIGHT;
}

/** Clamps a coordinate pair into the playable area, writing into `target`. */
export function clampToWorldInto(x: number, y: number, target: { x: number; y: number }): void {
  target.x = x < 0 ? 0 : x > WORLD_WIDTH ? WORLD_WIDTH : x;
  target.y = y < 0 ? 0 : y > WORLD_HEIGHT ? WORLD_HEIGHT : y;
}

/** True when `value` is a finite number, rejecting NaN and Infinity. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** True when `value` is a non-negative integer. */
export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
