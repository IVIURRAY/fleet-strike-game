import { describe, expect, it } from 'vitest';

import {
  circleIntersectsRect,
  circlesOverlap,
  isPointInCircle,
  isPointInRect,
  pointToSegmentDistanceSquared,
  segmentIntersectsCircle,
} from './collision';

describe('isPointInCircle', () => {
  it('accepts points inside and on the boundary', () => {
    expect(isPointInCircle(0, 0, 0, 0, 10)).toBe(true);
    expect(isPointInCircle(10, 0, 0, 0, 10)).toBe(true);
  });

  it('rejects points outside', () => {
    expect(isPointInCircle(11, 0, 0, 0, 10)).toBe(false);
  });
});

describe('circlesOverlap', () => {
  it('detects overlap and touching', () => {
    expect(circlesOverlap(0, 0, 5, 8, 0, 5)).toBe(true);
    expect(circlesOverlap(0, 0, 5, 10, 0, 5)).toBe(true);
  });

  it('rejects separated circles', () => {
    expect(circlesOverlap(0, 0, 5, 11, 0, 5)).toBe(false);
  });
});

describe('pointToSegmentDistanceSquared', () => {
  it('measures perpendicular distance to the segment interior', () => {
    expect(pointToSegmentDistanceSquared(5, 3, 0, 0, 10, 0)).toBe(9);
  });

  it('clamps to the start endpoint', () => {
    expect(pointToSegmentDistanceSquared(-4, 0, 0, 0, 10, 0)).toBe(16);
  });

  it('clamps to the end endpoint', () => {
    expect(pointToSegmentDistanceSquared(13, 0, 0, 0, 10, 0)).toBe(9);
  });

  it('handles a degenerate zero-length segment', () => {
    expect(pointToSegmentDistanceSquared(3, 4, 0, 0, 0, 0)).toBe(25);
  });
});

describe('segmentIntersectsCircle', () => {
  it('detects a swept hit that a point test would miss', () => {
    // A projectile jumping from x=-50 to x=50 passes through a small ship at
    // the origin without ever being sampled inside it.
    expect(isPointInCircle(-50, 0, 0, 0, 5)).toBe(false);
    expect(isPointInCircle(50, 0, 0, 0, 5)).toBe(false);
    expect(segmentIntersectsCircle(-50, 0, 50, 0, 0, 0, 5)).toBe(true);
  });

  it('rejects a path that passes wide of the target', () => {
    expect(segmentIntersectsCircle(-50, 20, 50, 20, 0, 0, 5)).toBe(false);
  });

  it('detects a hit at the end of the path', () => {
    expect(segmentIntersectsCircle(0, 0, 100, 0, 103, 0, 5)).toBe(true);
  });
});

describe('rectangles', () => {
  it('tests point containment', () => {
    expect(isPointInRect(5, 5, 0, 0, 10, 10)).toBe(true);
    expect(isPointInRect(0, 0, 0, 0, 10, 10)).toBe(true);
    expect(isPointInRect(11, 5, 0, 0, 10, 10)).toBe(false);
  });

  it('tests circle intersection including corners', () => {
    expect(circleIntersectsRect(5, 5, 1, 0, 0, 10, 10)).toBe(true);
    expect(circleIntersectsRect(-3, 5, 5, 0, 0, 10, 10)).toBe(true);
    expect(circleIntersectsRect(-10, -10, 5, 0, 0, 10, 10)).toBe(false);
  });
});
