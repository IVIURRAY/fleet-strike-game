/**
 * Planet, moon and building sprites.
 */

import { Container, Graphics } from 'pixi.js';
import type { BuildingType, PlanetDefinition, PlanetKind } from '@fleet-strike/types';
import { COLORS, OWNER_COLORS } from '@fleet-strike/config';

/** Surface tint per planet archetype, distinguishing them at a glance. */
const PLANET_TINTS: Readonly<Record<PlanetKind, number>> = {
  capital: 0x3a4a6a,
  gold: 0x6a5a2a,
  crystal: 0x2a5a6a,
  center: 0x4a3a5a,
  gas: 0x6a4a2a,
  tungsten: 0x4a4a52,
};

/** A planet display object plus the parts that change with ownership. */
export interface PlanetSprite {
  readonly container: Container;
  readonly body: Graphics;
  readonly ring: Graphics;
  readonly captureArc: Graphics;
}

/** Creates the layered graphics for one planet. */
export function createPlanetSprite(planet: PlanetDefinition): PlanetSprite {
  const container = new Container();
  container.x = planet.x;
  container.y = planet.y;

  const body = new Graphics();
  body.circle(0, 0, planet.radius);
  body.fill({ color: PLANET_TINTS[planet.kind], alpha: 0.95 });
  body.stroke({ color: COLORS.neutral, width: 3, alpha: 0.5 });

  // A few darker blotches so planets do not read as flat discs.
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI * 2 * i) / 4 + planet.index;
    const distance = planet.radius * 0.45;
    body.circle(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance,
      planet.radius * (0.14 + (i % 3) * 0.05)
    );
  }
  body.fill({ color: 0x000000, alpha: 0.16 });

  // Ownership ring, retinted as the planet changes hands.
  const ring = new Graphics();
  ring.circle(0, 0, planet.radius + 14);
  ring.stroke({ color: OWNER_COLORS[planet.initialOwner], width: 5, alpha: 0.9 });

  // Capture progress arc, redrawn each frame.
  const captureArc = new Graphics();

  container.addChild(body, ring, captureArc);
  return { container, body, ring, captureArc };
}

/** Retints a planet's ownership ring. */
export function setPlanetOwner(sprite: PlanetSprite, owner: 0 | 1 | 2, radius: number): void {
  sprite.ring.clear();
  sprite.ring.circle(0, 0, radius + 14);
  sprite.ring.stroke({ color: OWNER_COLORS[owner], width: 5, alpha: 0.9 });
}

/**
 * Redraws the capture progress arc.
 *
 * `progress` is the signed capture bar in [-100, 100]; negative favours player
 * one. The arc length shows how contested the planet is and its colour shows
 * who is winning.
 */
export function setCaptureProgress(
  sprite: PlanetSprite,
  progress: number,
  threshold: number,
  radius: number
): void {
  const arc = sprite.captureArc;
  arc.clear();

  const fraction = Math.min(1, Math.abs(progress) / threshold);
  if (fraction <= 0.001) return;

  const color = progress < 0 ? OWNER_COLORS[1] : OWNER_COLORS[2];
  const start = -Math.PI / 2;
  arc.arc(0, 0, radius + 28, start, start + Math.PI * 2 * fraction);
  arc.stroke({ color, width: 7, alpha: 0.95 });
}

/** Creates the graphics for a moon. */
export function createMoonSprite(radius: number): Graphics {
  const moon = new Graphics();
  moon.circle(0, 0, radius);
  moon.fill({ color: 0x5a5f70, alpha: 0.95 });
  moon.stroke({ color: 0x8892a6, width: 2, alpha: 0.6 });
  // Craters.
  moon.circle(-radius * 0.3, -radius * 0.2, radius * 0.22);
  moon.circle(radius * 0.35, radius * 0.15, radius * 0.16);
  moon.fill({ color: 0x000000, alpha: 0.2 });
  return moon;
}

/** Marks buildings that are weapons so they can be drawn differently. */
const TURRET_TYPES = new Set<BuildingType>([
  'plasmaTurret',
  'flakBattery',
  'laserArray',
  'missileSilo',
]);

/** Creates the graphics for a building. */
export function createBuildingSprite(type: BuildingType, owner: 0 | 1 | 2, radius = 26): Graphics {
  const graphics = new Graphics();
  const color = OWNER_COLORS[owner];

  if (TURRET_TYPES.has(type)) {
    // Turrets are diamonds so defences read differently from production.
    graphics.poly([radius, 0, 0, radius, -radius, 0, 0, -radius]);
  } else if (type === 'commandCenter') {
    // The capital hub is a hexagon.
    const points: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      points.push(Math.cos(angle) * radius * 1.5, Math.sin(angle) * radius * 1.5);
    }
    graphics.poly(points);
  } else {
    graphics.rect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 1.6);
  }

  graphics.fill({ color, alpha: 0.35 });
  graphics.stroke({ color, width: 2.5, alpha: 0.95 });
  return graphics;
}

/** Draws the six trade lanes connecting adjacent planets. */
export function createLaneSprite(planets: readonly PlanetDefinition[]): Graphics {
  const lanes = new Graphics();
  for (let i = 1; i < planets.length; i += 1) {
    const from = planets[i - 1];
    const to = planets[i];
    if (from === undefined || to === undefined) continue;
    lanes.moveTo(from.x, from.y);
    lanes.lineTo(to.x, to.y);
  }
  lanes.stroke({ color: COLORS.cyan, width: 3, alpha: 0.14 });
  return lanes;
}
