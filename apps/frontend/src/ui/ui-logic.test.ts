import { describe, expect, it } from 'vitest';

import { PLANETS, WORLD_HEIGHT, WORLD_WIDTH } from '@fleet-strike/config';

import { findPlanetAt } from '../game/input/pointer';
import { formatDuration } from '../app';
import { formatClock } from './hud/update-hud';
import { escapeHtml } from './screens/menu';

describe('formatClock', () => {
  it('formats minutes and seconds with padding', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(9)).toBe('00:09');
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(20 * 60)).toBe('20:00');
  });

  it('floors fractional seconds', () => {
    expect(formatClock(9.99)).toBe('00:09');
  });

  it('clamps negatives to zero', () => {
    expect(formatClock(-30)).toBe('00:00');
  });
});

describe('formatDuration', () => {
  it('omits minutes under a minute', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('includes minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('handles exact minutes', () => {
    expect(formatDuration(120)).toBe('2m 0s');
  });
});

describe('escapeHtml', () => {
  it('escapes markup so player names cannot inject HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('escapes quotes and ampersands', () => {
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Commander Shepard')).toBe('Commander Shepard');
  });
});

describe('findPlanetAt', () => {
  it('finds a planet at its centre', () => {
    const planet = PLANETS[3]!;
    expect(findPlanetAt(planet.x, planet.y)).toBe(3);
  });

  it('finds a planet within its padded radius', () => {
    const planet = PLANETS[0]!;
    expect(findPlanetAt(planet.x + planet.radius + 30, planet.y)).toBe(0);
  });

  it('returns null in empty space', () => {
    const a = PLANETS[0]!;
    const b = PLANETS[1]!;
    const midpoint = (a.x + b.x) / 2;
    expect(findPlanetAt(midpoint, a.y)).toBeNull();
  });

  it('returns null well outside the map', () => {
    expect(findPlanetAt(-5000, -5000)).toBeNull();
  });

  it('respects a custom padding', () => {
    const planet = PLANETS[0]!;
    const justOutside = planet.x + planet.radius + 100;
    expect(findPlanetAt(justOutside, planet.y, 0)).toBeNull();
    expect(findPlanetAt(justOutside, planet.y, 200)).toBe(0);
  });

  it('identifies every planet in the chain', () => {
    for (const planet of PLANETS) {
      expect(findPlanetAt(planet.x, planet.y)).toBe(planet.index);
    }
  });
});

describe('world dimensions', () => {
  it('keeps the lane inside the world', () => {
    for (const planet of PLANETS) {
      expect(planet.y).toBeGreaterThan(0);
      expect(planet.y).toBeLessThan(WORLD_HEIGHT);
      expect(planet.x).toBeGreaterThan(0);
      expect(planet.x).toBeLessThan(WORLD_WIDTH);
    }
  });
});
