import { describe, expect, it } from 'vitest';

import {
  CULL_MARGIN,
  LOD_DOT_ZOOM,
  LOD_SIMPLE_ZOOM,
  isCircleVisible,
  isPointVisible,
  lodForZoom,
  shouldDrawHealthBars,
  shouldDrawTrails,
} from './culling';

const viewport = { x: 1000, y: 1000, width: 800, height: 600 };

describe('isCircleVisible', () => {
  it('accepts a circle inside the viewport', () => {
    expect(isCircleVisible(1400, 1300, 10, viewport, 0)).toBe(true);
  });

  it('rejects a circle well outside', () => {
    expect(isCircleVisible(5000, 5000, 10, viewport, 0)).toBe(false);
  });

  it('accepts a circle straddling the edge', () => {
    expect(isCircleVisible(990, 1300, 20, viewport, 0)).toBe(true);
  });

  it('rejects a circle just clear of the edge', () => {
    expect(isCircleVisible(970, 1300, 20, viewport, 0)).toBe(false);
  });

  it('includes the margin so entities do not pop in at the boundary', () => {
    // Outside with no margin, inside once the default margin applies.
    expect(isCircleVisible(940, 1300, 10, viewport, 0)).toBe(false);
    expect(isCircleVisible(940, 1300, 10, viewport)).toBe(true);
    expect(CULL_MARGIN).toBeGreaterThan(0);
  });

  it('handles all four sides', () => {
    expect(isCircleVisible(1400, 960, 10, viewport, 0)).toBe(false);
    expect(isCircleVisible(1400, 1650, 10, viewport, 0)).toBe(false);
    expect(isCircleVisible(1850, 1300, 10, viewport, 0)).toBe(false);
    expect(isCircleVisible(1400, 1300, 10, viewport, 0)).toBe(true);
  });

  it('treats a large radius as visible even when the centre is far off', () => {
    // A planet 400 units across whose centre sits outside the view.
    expect(isCircleVisible(700, 1300, 400, viewport, 0)).toBe(true);
  });
});

describe('isPointVisible', () => {
  it('matches a zero-radius circle', () => {
    expect(isPointVisible(1400, 1300, viewport, 0)).toBe(true);
    expect(isPointVisible(500, 1300, viewport, 0)).toBe(false);
  });
});

describe('level of detail', () => {
  it('collapses to dots when zoomed far out', () => {
    expect(lodForZoom(LOD_DOT_ZOOM / 2)).toBe('dot');
  });

  it('uses simple shapes at medium zoom', () => {
    expect(lodForZoom((LOD_DOT_ZOOM + LOD_SIMPLE_ZOOM) / 2)).toBe('simple');
  });

  it('uses full detail when zoomed in', () => {
    expect(lodForZoom(LOD_SIMPLE_ZOOM + 0.5)).toBe('full');
  });

  it('is monotonic across the zoom range', () => {
    const order = { dot: 0, simple: 1, full: 2 };
    let previous = -1;
    for (let zoom = 0.01; zoom < 2.5; zoom += 0.01) {
      const level = order[lodForZoom(zoom)];
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it('hides health bars and trails when they would be sub-pixel', () => {
    expect(shouldDrawHealthBars(LOD_SIMPLE_ZOOM - 0.01)).toBe(false);
    expect(shouldDrawHealthBars(LOD_SIMPLE_ZOOM)).toBe(true);
    expect(shouldDrawTrails(LOD_DOT_ZOOM - 0.01)).toBe(false);
    expect(shouldDrawTrails(LOD_DOT_ZOOM)).toBe(true);
  });
});
