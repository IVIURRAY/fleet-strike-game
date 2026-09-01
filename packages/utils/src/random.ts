/**
 * Deterministic pseudo-random number generation.
 *
 * The simulation must be reproducible for replays and for tests, so it never
 * calls `Math.random` directly. `mulberry32` is a small, fast, well-distributed
 * 32-bit generator.
 */

/** A seeded random source returning values in `[0, 1)`. */
export type RandomSource = () => number;

/** Creates a seeded generator. The same seed always yields the same sequence. */
export function createRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform float in `[min, max)`. */
export function randomRange(random: RandomSource, min: number, max: number): number {
  return min + random() * (max - min);
}

/** Uniform integer in `[min, max]`. */
export function randomInt(random: RandomSource, min: number, max: number): number {
  return Math.floor(min + random() * (max - min + 1));
}

/** A random angle in radians. */
export function randomAngle(random: RandomSource): number {
  return random() * Math.PI * 2;
}

/** Picks a uniformly random element, or `undefined` when the list is empty. */
export function randomElement<T>(random: RandomSource, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}

/** A random point on a circle of `radius` around `(cx, cy)`. */
export function randomPointOnCircle(
  random: RandomSource,
  cx: number,
  cy: number,
  radius: number
): { x: number; y: number } {
  const angle = randomAngle(random);
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}
