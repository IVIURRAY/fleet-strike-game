import { describe, expect, it } from 'vitest';

import {
  angleDelta,
  clamp,
  clampMagnitudeInto,
  distance,
  distanceSquared,
  dot,
  lerp,
  magnitude,
  normalize,
  normalizeInto,
  rotateToward,
  toDegrees,
  toRadians,
  wrapAngle,
} from './vector';

describe('distance', () => {
  it('measures a 3-4-5 triangle', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
    expect(distanceSquared(0, 0, 3, 4)).toBe(25);
  });

  it('is zero for identical points', () => {
    expect(distance(7, -2, 7, -2)).toBe(0);
  });

  it('handles negative coordinates', () => {
    expect(distance(-3, -4, 0, 0)).toBe(5);
  });
});

describe('magnitude', () => {
  it('returns vector length', () => {
    expect(magnitude(3, 4)).toBe(5);
    expect(magnitude(0, 0)).toBe(0);
  });
});

describe('normalize', () => {
  it('produces a unit vector', () => {
    const result = normalize(3, 4);
    expect(result.x).toBeCloseTo(0.6, 10);
    expect(result.y).toBeCloseTo(0.8, 10);
    expect(magnitude(result.x, result.y)).toBeCloseTo(1, 10);
  });

  it('returns zero for a zero vector instead of NaN', () => {
    const result = normalize(0, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('writes into the supplied target without allocating', () => {
    const target = { x: 99, y: 99 };
    const returned = normalizeInto(0, 5, target);
    expect(returned).toBe(target);
    expect(target).toEqual({ x: 0, y: 1 });
  });
});

describe('clampMagnitudeInto', () => {
  it('leaves short vectors untouched', () => {
    const target = { x: 0, y: 0 };
    clampMagnitudeInto(1, 1, 10, target);
    expect(target).toEqual({ x: 1, y: 1 });
  });

  it('scales long vectors down to the maximum', () => {
    const target = { x: 0, y: 0 };
    clampMagnitudeInto(300, 400, 100, target);
    expect(magnitude(target.x, target.y)).toBeCloseTo(100, 10);
    expect(target.x).toBeCloseTo(60, 10);
    expect(target.y).toBeCloseTo(80, 10);
  });

  it('handles a zero vector', () => {
    const target = { x: 9, y: 9 };
    clampMagnitudeInto(0, 0, 50, target);
    expect(target).toEqual({ x: 0, y: 0 });
  });
});

describe('clamp and lerp', () => {
  it('clamps to bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});

describe('dot', () => {
  it('is zero for perpendicular vectors', () => {
    expect(dot(1, 0, 0, 1)).toBe(0);
  });

  it('is positive for aligned vectors', () => {
    expect(dot(2, 0, 3, 0)).toBe(6);
  });
});

describe('angles', () => {
  it('wraps into (-PI, PI]', () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 10);
    expect(wrapAngle(-Math.PI * 3)).toBeCloseTo(Math.PI, 10);
    expect(wrapAngle(Math.PI * 2)).toBeCloseTo(0, 10);
  });

  it('takes the shortest path between angles', () => {
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 10);
    // Turning from just below a full circle to zero is a small positive step.
    expect(angleDelta(-Math.PI * 0.9, Math.PI * 0.9)).toBeCloseTo(-Math.PI * 0.2, 10);
  });

  it('converts between degrees and radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 10);
    expect(toDegrees(Math.PI)).toBeCloseTo(180, 10);
  });
});

describe('rotateToward', () => {
  it('snaps to the target when within the step', () => {
    expect(rotateToward(0, 0.05, 0.1)).toBeCloseTo(0.05, 10);
  });

  it('limits rotation to the maximum step', () => {
    expect(rotateToward(0, Math.PI, 0.1)).toBeCloseTo(0.1, 10);
  });

  it('turns the short way around', () => {
    // From 170 degrees toward -170 degrees is a +20 degree turn, not -340.
    const from = toRadians(170);
    const to = toRadians(-170);
    const result = rotateToward(from, to, toRadians(5));
    expect(toDegrees(result)).toBeCloseTo(175, 6);
  });
});
