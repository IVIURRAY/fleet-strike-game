/**
 * Ship sprites.
 *
 * There are no art assets, so each class is drawn procedurally as a distinct
 * silhouette. docs/MVP_Design.md calls for "recognizable ship silhouettes", and
 * generated geometry keeps the bundle small while staying readable at low zoom.
 *
 * Every ship points along +X at rotation 0, matching the simulation's angle
 * convention.
 */

import { Graphics } from 'pixi.js';
import type { ShipType } from '@fleet-strike/types';
import { SHIPS, SHIP_RENDER_SCALE } from '@fleet-strike/config';

/** Draws the silhouette for a ship class into a Graphics object. */
export function drawShipShape(graphics: Graphics, type: ShipType, color: number): Graphics {
  const size = SHIPS[type].hitboxRadius * SHIP_RENDER_SCALE;
  graphics.clear();

  switch (type) {
    case 'scout':
      // Narrow dart.
      graphics.poly([size, 0, -size * 0.7, size * 0.6, -size * 0.4, 0, -size * 0.7, -size * 0.6]);
      break;

    case 'soldier':
      // Broader arrowhead with swept wings.
      graphics.poly([
        size, 0,
        -size * 0.4, size * 0.75,
        -size, size * 0.5,
        -size * 0.6, 0,
        -size, -size * 0.5,
        -size * 0.4, -size * 0.75,
      ]);
      break;

    case 'heavy':
      // Blocky gunship hull.
      graphics.poly([
        size, size * 0.35,
        size, -size * 0.35,
        size * 0.2, -size * 0.8,
        -size * 0.9, -size * 0.8,
        -size, 0,
        -size * 0.9, size * 0.8,
        size * 0.2, size * 0.8,
      ]);
      break;

    case 'medic':
      // Rounded hull, drawn with a cross marking added by the caller.
      graphics.ellipse(0, 0, size * 0.9, size * 0.65);
      break;

    case 'engineer':
      // Utility hull with a forward tool arm.
      graphics.poly([
        size, size * 0.15,
        size, -size * 0.15,
        size * 0.1, -size * 0.7,
        -size * 0.85, -size * 0.55,
        -size * 0.85, size * 0.55,
        size * 0.1, size * 0.7,
      ]);
      break;

    case 'bomber':
      // Wide flying wing.
      graphics.poly([
        size * 0.9, 0,
        size * 0.1, size,
        -size * 0.8, size * 0.7,
        -size * 0.5, 0,
        -size * 0.8, -size * 0.7,
        size * 0.1, -size,
      ]);
      break;

    case 'sniper':
      // Long, thin frigate with a pronounced barrel.
      graphics.poly([
        size * 1.3, 0,
        size * 0.2, size * 0.32,
        -size, size * 0.45,
        -size * 0.75, 0,
        -size, -size * 0.45,
        size * 0.2, -size * 0.32,
      ]);
      break;
  }

  graphics.fill({ color, alpha: 0.85 });
  graphics.stroke({ color, width: Math.max(1, size * 0.12), alpha: 1 });

  // Medics get a visible cross so support ships are identifiable in a brawl.
  if (type === 'medic') {
    graphics.rect(-size * 0.08, -size * 0.4, size * 0.16, size * 0.8);
    graphics.rect(-size * 0.4, -size * 0.08, size * 0.8, size * 0.16);
    graphics.fill({ color: 0xffffff, alpha: 0.9 });
  }

  return graphics;
}

/** Creates a Graphics display object for a ship. */
export function createShipSprite(type: ShipType, color: number): Graphics {
  const graphics = new Graphics();
  drawShipShape(graphics, type, color);
  return graphics;
}

/** Rendered radius of a ship class, used for culling and hit testing. */
export function shipRenderRadius(type: ShipType): number {
  return SHIPS[type].hitboxRadius * SHIP_RENDER_SCALE;
}
