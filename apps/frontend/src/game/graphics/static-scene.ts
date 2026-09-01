/**
 * Static scene: planets, moons and trade lanes.
 *
 * These are created once and then only retinted, since planet geometry never
 * changes and only moons move.
 */

import { Graphics } from 'pixi.js';
import {
  CAPTURE_RADIUS,
  CAPTURE_THRESHOLD,
  PLANETS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '@fleet-strike/config';
import {
  createLaneSprite,
  createMoonSprite,
  createPlanetSprite,
  createStarfield,
  setCaptureProgress,
  setPlanetOwner,
} from '@fleet-strike/renderer';
import type { PlanetSprite } from '@fleet-strike/renderer';
import { createRandom } from '@fleet-strike/utils';

import type { SceneLayers } from '../canvas/create-canvas';
import type { GameStore } from '../state/store';

/** Handles to the parts of the static scene that change at runtime. */
export interface StaticScene {
  readonly planets: Map<number, PlanetSprite>;
  readonly moons: Map<string, Graphics>;
  /** Capture radius rings, shown while a planet is contested. */
  readonly captureRings: Map<number, Graphics>;
}

/** Builds the background, lanes, planets and moons. */
export function buildStaticScene(layers: SceneLayers): StaticScene {
  // Seeded so the starfield is identical between reloads and between players.
  layers.background.addChild(
    createStarfield(WORLD_WIDTH, WORLD_HEIGHT, 900, createRandom(20240901))
  );

  layers.lanes.addChild(createLaneSprite(PLANETS));

  const planets = new Map<number, PlanetSprite>();
  const captureRings = new Map<number, Graphics>();
  const moons = new Map<string, Graphics>();

  for (const planet of PLANETS) {
    const sprite = createPlanetSprite(planet);
    layers.planets.addChild(sprite.container);
    planets.set(planet.index, sprite);

    // Dashed-looking capture radius ring, drawn faintly under the planet.
    const ring = new Graphics();
    ring.circle(planet.x, planet.y, CAPTURE_RADIUS);
    ring.stroke({ color: 0xffffff, width: 2, alpha: 0.07 });
    layers.lanes.addChild(ring);
    captureRings.set(planet.index, ring);

    for (const moon of planet.moons) {
      const moonSprite = createMoonSprite(moon.radius);
      layers.moons.addChild(moonSprite);
      moons.set(moon.id, moonSprite);
    }
  }

  return { planets, moons, captureRings };
}

/** Updates planet ownership rings, capture arcs and moon positions. */
export function updateStaticScene(scene: StaticScene, store: GameStore): void {
  for (const state of store.planets) {
    const definition = PLANETS[state.index];
    const sprite = scene.planets.get(state.index);
    if (definition === undefined || sprite === undefined) continue;

    setPlanetOwner(sprite, state.owner, definition.radius);
    setCaptureProgress(sprite, state.captureProgress, CAPTURE_THRESHOLD, definition.radius);

    // Highlight the capture ring only while ships are actually contesting it.
    const ring = scene.captureRings.get(state.index);
    if (ring !== undefined) {
      const contested = state.presence[1] > 0 || state.presence[2] > 0;
      ring.alpha = contested ? 1 : 0.35;
    }
  }

  for (const moon of store.moons) {
    const sprite = scene.moons.get(moon.id);
    if (sprite === undefined) continue;
    sprite.x = moon.x;
    sprite.y = moon.y;
  }
}

/** Highlights the selected planet with a bright outline. */
export function setSelectedPlanet(highlight: Graphics, planetIndex: number | null): void {
  highlight.clear();
  if (planetIndex === null) {
    highlight.visible = false;
    return;
  }

  const planet = PLANETS[planetIndex];
  if (planet === undefined) {
    highlight.visible = false;
    return;
  }

  highlight.visible = true;
  highlight.circle(planet.x, planet.y, planet.radius + 40);
  highlight.stroke({ color: 0xffffff, width: 4, alpha: 0.85 });
}
