import { describe, expect, it } from 'vitest';

import { createRandom, randomPointOnCircle } from '../random';
import { magnitude } from './vector';
import { damp, easeOutQuad, lerpAngle, lerpVectorInto, remap, smoothStep } from './interpolation';

describe('lerpVectorInto', () => {
  it('interpolates both axes into the target', () => {
    const target = { x: 0, y: 0 };
    lerpVectorInto(0, 0, 10, 20, 0.5, target);
    expect(target).toEqual({ x: 5, y: 10 });
  });

  it('returns the endpoints at t = 0 and t = 1', () => {
    const target = { x: 0, y: 0 };
    lerpVectorInto(1, 2, 9, 8, 0, target);
    expect(target).toEqual({ x: 1, y: 2 });
    lerpVectorInto(1, 2, 9, 8, 1, target);
    expect(target).toEqual({ x: 9, y: 8 });
  });
});

describe('damp', () => {
  it('moves toward the target without overshooting', () => {
    let value = 0;
    for (let i = 0; i < 100; i += 1) {
      value = damp(value, 100, 5, 1 / 60);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(value).toBeGreaterThan(99);
  });

  it('is frame-rate independent to within a small tolerance', () => {
    let fast = 0;
    for (let i = 0; i < 120; i += 1) fast = damp(fast, 100, 4, 1 / 120);

    let slow = 0;
    for (let i = 0; i < 30; i += 1) slow = damp(slow, 100, 4, 1 / 30);

    expect(Math.abs(fast - slow)).toBeLessThan(0.001);
  });

  it('stays put when already at the target', () => {
    expect(damp(50, 50, 10, 0.016)).toBe(50);
  });
});

describe('lerpAngle', () => {
  it('takes the short arc across the wrap point', () => {
    const from = Math.PI * 0.9;
    const to = -Math.PI * 0.9;
    const mid = lerpAngle(from, to, 0.5);
    // The short arc crosses PI, so the midpoint sits at +/-PI rather than 0.
    expect(Math.abs(Math.abs(mid) - Math.PI)).toBeLessThan(0.001);
  });

  it('interpolates directly when no wrap is involved', () => {
    expect(lerpAngle(0, 1, 0.5)).toBeCloseTo(0.5, 10);
  });

  it('returns the start at t = 0', () => {
    expect(lerpAngle(1, 2, 0)).toBeCloseTo(1, 10);
  });
});

describe('remap', () => {
  it('maps between ranges', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(0, 0, 10, 20, 40)).toBe(20);
  });

  it('clamps outside the input range', () => {
    expect(remap(-5, 0, 10, 0, 100)).toBe(0);
    expect(remap(15, 0, 10, 0, 100)).toBe(100);
  });

  it('handles a degenerate input range', () => {
    expect(remap(5, 3, 3, 7, 9)).toBe(7);
  });
});

describe('easing', () => {
  it('anchors smoothStep at both ends', () => {
    expect(smoothStep(0)).toBe(0);
    expect(smoothStep(1)).toBe(1);
    expect(smoothStep(0.5)).toBeCloseTo(0.5, 10);
  });

  it('clamps smoothStep outside [0, 1]', () => {
    expect(smoothStep(-1)).toBe(0);
    expect(smoothStep(2)).toBe(1);
  });

  it('anchors easeOutQuad and decelerates', () => {
    expect(easeOutQuad(0)).toBe(0);
    expect(easeOutQuad(1)).toBe(1);
    expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
  });
});

describe('randomPointOnCircle', () => {
  it('places points on the circle', () => {
    const random = createRandom(17);
    for (let i = 0; i < 200; i += 1) {
      const point = randomPointOnCircle(random, 100, 200, 50);
      expect(magnitude(point.x - 100, point.y - 200)).toBeCloseTo(50, 6);
    }
  });

  it('returns the centre for a zero radius', () => {
    const point = randomPointOnCircle(createRandom(1), 10, 20, 0);
    expect(point).toEqual({ x: 10, y: 20 });
  });
});
