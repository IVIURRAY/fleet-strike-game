/**
 * Projectile and waypoint sprites.
 */

import { Graphics } from 'pixi.js';
import type { WeaponType } from '@fleet-strike/types';
import { COLORS, WEAPONS } from '@fleet-strike/config';

/**
 * Creates the graphics for one projectile class.
 *
 * Shapes differ per weapon so players can read incoming fire, which
 * docs/MVP_Design.md calls for under "different bullet colors and shapes".
 */
export function createProjectileSprite(weaponType: WeaponType): Graphics {
  const config = WEAPONS[weaponType];
  const graphics = new Graphics();
  const r = config.projectileRadius;

  switch (weaponType) {
    case 'rocket':
    case 'bomb':
      // Elongated body with a tail fin.
      graphics.poly([r * 2.4, 0, -r, r, -r * 1.6, 0, -r, -r]);
      break;
    case 'flak':
      graphics.circle(0, 0, r);
      break;
    case 'plasma':
      graphics.circle(0, 0, r);
      break;
    default:
      // Bullets are short tracers.
      graphics.rect(-r * 2, -r * 0.5, r * 4, r);
      break;
  }

  graphics.fill({ color: config.color, alpha: 0.95 });
  return graphics;
}

/**
 * Draws a hitscan beam between two points.
 *
 * Lasers resolve instantly, so they have no projectile entity; the client draws
 * a fading line for a few frames instead.
 */
export function drawBeam(
  graphics: Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: number,
  alpha: number
): void {
  graphics.moveTo(fromX, fromY);
  graphics.lineTo(toX, toY);
  graphics.stroke({ color, width: 2.5, alpha });
}

/** Creates the player's waypoint marker. */
export function createWaypointSprite(color: number): Graphics {
  const graphics = new Graphics();
  const size = 46;

  // Outer ring plus a cross, so it stays visible over any background.
  graphics.circle(0, 0, size);
  graphics.stroke({ color, width: 4, alpha: 0.9 });
  graphics.circle(0, 0, size * 0.45);
  graphics.stroke({ color, width: 2.5, alpha: 0.6 });

  graphics.moveTo(-size * 1.5, 0);
  graphics.lineTo(-size * 0.7, 0);
  graphics.moveTo(size * 0.7, 0);
  graphics.lineTo(size * 1.5, 0);
  graphics.moveTo(0, -size * 1.5);
  graphics.lineTo(0, -size * 0.7);
  graphics.moveTo(0, size * 0.7);
  graphics.lineTo(0, size * 1.5);
  graphics.stroke({ color, width: 3, alpha: 0.8 });

  return graphics;
}

/** Creates a starfield backdrop sized to the world. */
export function createStarfield(
  width: number,
  height: number,
  count: number,
  random: () => number
): Graphics {
  const stars = new Graphics();
  for (let i = 0; i < count; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = 1 + random() * 2.2;
    stars.circle(x, y, radius);
  }
  stars.fill({ color: 0xffffff, alpha: 0.35 });

  // A second, brighter sparse layer for depth.
  for (let i = 0; i < Math.floor(count / 8); i += 1) {
    const x = random() * width;
    const y = random() * height;
    stars.circle(x, y, 2 + random() * 2);
  }
  stars.fill({ color: COLORS.cyanBright, alpha: 0.5 });

  return stars;
}
