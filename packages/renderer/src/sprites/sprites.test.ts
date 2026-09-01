import { describe, expect, it } from 'vitest';
import { Graphics } from 'pixi.js';

import {
  MOON_BUILDING_TYPES,
  PLANET_BUILDING_TYPES,
  SHIP_TYPES,
  WEAPON_TYPES,
} from '@fleet-strike/types';
import { CAPTURE_THRESHOLD, PLANETS } from '@fleet-strike/config';
import { createRandom } from '@fleet-strike/utils';

import { createShipSprite, drawShipShape, shipRenderRadius } from './ship-sprite';
import {
  createBuildingSprite,
  createLaneSprite,
  createMoonSprite,
  createPlanetSprite,
  setCaptureProgress,
  setPlanetOwner,
} from './planet-sprite';
import {
  createProjectileSprite,
  createStarfield,
  createWaypointSprite,
  drawBeam,
} from './projectile-sprite';

describe('ship sprites', () => {
  it('builds a distinct sprite for every ship class', () => {
    for (const type of SHIP_TYPES) {
      const sprite = createShipSprite(type, 0x4fcbe9);
      expect(sprite).toBeInstanceOf(Graphics);
      // A drawn shape must produce geometry.
      expect(sprite.bounds.width).toBeGreaterThan(0);
      expect(sprite.bounds.height).toBeGreaterThan(0);
    }
  });

  it('scales sprite size with the ship hitbox', () => {
    expect(shipRenderRadius('heavy')).toBeGreaterThan(shipRenderRadius('scout'));
  });

  it('can be redrawn in place without accumulating geometry', () => {
    const graphics = new Graphics();
    drawShipShape(graphics, 'scout', 0xffffff);
    const first = graphics.bounds.width;
    drawShipShape(graphics, 'scout', 0xffffff);
    expect(graphics.bounds.width).toBeCloseTo(first, 3);
  });

  it('renders larger ships bigger than smaller ones', () => {
    const scout = createShipSprite('scout', 0xffffff);
    const heavy = createShipSprite('heavy', 0xffffff);
    expect(heavy.bounds.width).toBeGreaterThan(scout.bounds.width);
  });
});

describe('planet sprites', () => {
  it('builds a sprite for every planet in the chain', () => {
    for (const planet of PLANETS) {
      const sprite = createPlanetSprite(planet);
      expect(sprite.container.x).toBe(planet.x);
      expect(sprite.container.y).toBe(planet.y);
      expect(sprite.container.children.length).toBe(3);
    }
  });

  it('retints the ownership ring', () => {
    const planet = PLANETS[0]!;
    const sprite = createPlanetSprite(planet);
    expect(() => setPlanetOwner(sprite, 2, planet.radius)).not.toThrow();
    expect(() => setPlanetOwner(sprite, 0, planet.radius)).not.toThrow();
  });

  it('draws nothing for an uncontested capture bar', () => {
    const planet = PLANETS[3]!;
    const sprite = createPlanetSprite(planet);
    setCaptureProgress(sprite, 0, CAPTURE_THRESHOLD, planet.radius);
    expect(sprite.captureArc.bounds.width).toBe(0);
  });

  it('draws an arc for a contested capture bar', () => {
    const planet = PLANETS[3]!;
    const sprite = createPlanetSprite(planet);
    setCaptureProgress(sprite, CAPTURE_THRESHOLD, CAPTURE_THRESHOLD, planet.radius);
    expect(sprite.captureArc.bounds.width).toBeGreaterThan(0);
  });

  it('handles both capture directions', () => {
    const planet = PLANETS[3]!;
    const sprite = createPlanetSprite(planet);
    expect(() =>
      setCaptureProgress(sprite, -CAPTURE_THRESHOLD / 2, CAPTURE_THRESHOLD, planet.radius)
    ).not.toThrow();
    expect(() =>
      setCaptureProgress(sprite, CAPTURE_THRESHOLD / 2, CAPTURE_THRESHOLD, planet.radius)
    ).not.toThrow();
  });

  it('builds moon sprites', () => {
    const moon = createMoonSprite(120);
    expect(moon.bounds.width).toBeGreaterThan(0);
  });

  it('builds a sprite for every building type and owner', () => {
    for (const type of [...PLANET_BUILDING_TYPES, ...MOON_BUILDING_TYPES]) {
      for (const owner of [0, 1, 2] as const) {
        const sprite = createBuildingSprite(type, owner);
        expect(sprite.bounds.width).toBeGreaterThan(0);
      }
    }
  });

  it('draws the six trade lanes', () => {
    const lanes = createLaneSprite(PLANETS);
    expect(lanes.bounds.width).toBeGreaterThan(0);
  });

  it('tolerates a single-planet list', () => {
    expect(() => createLaneSprite([PLANETS[0]!])).not.toThrow();
  });
});

describe('projectile and overlay sprites', () => {
  it('builds a sprite for every weapon type', () => {
    for (const type of WEAPON_TYPES) {
      const sprite = createProjectileSprite(type);
      expect(sprite.bounds.width).toBeGreaterThan(0);
    }
  });

  it('draws a hitscan beam', () => {
    const graphics = new Graphics();
    drawBeam(graphics, 0, 0, 500, 300, 0x67ddf7, 0.8);
    expect(graphics.bounds.width).toBeGreaterThan(0);
  });

  it('builds the waypoint marker', () => {
    const marker = createWaypointSprite(0x4fcbe9);
    expect(marker.bounds.width).toBeGreaterThan(0);
  });

  it('builds a deterministic starfield', () => {
    const a = createStarfield(2000, 1000, 100, createRandom(42));
    const b = createStarfield(2000, 1000, 100, createRandom(42));
    expect(a.bounds.width).toBeCloseTo(b.bounds.width, 3);
  });

  it('handles a zero-star field', () => {
    expect(() => createStarfield(1000, 1000, 0, createRandom(1))).not.toThrow();
  });
});
