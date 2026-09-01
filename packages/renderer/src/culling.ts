/**
 * Frustum culling.
 *
 * With 200-300 ships and up to 1000 projectiles, updating a PixiJS display
 * object for every entity every frame is wasteful when most are off screen.
 * These helpers answer "is this worth drawing?" against a viewport.
 */

import type { Viewport } from './camera';

/** Extra world-space margin so entities are not popped in at the exact edge. */
export const CULL_MARGIN = 120;

/** True when a circle intersects the viewport, expanded by `margin`. */
export function isCircleVisible(
  x: number,
  y: number,
  radius: number,
  viewport: Viewport,
  margin = CULL_MARGIN
): boolean {
  const pad = radius + margin;
  return (
    x + pad >= viewport.x &&
    x - pad <= viewport.x + viewport.width &&
    y + pad >= viewport.y &&
    y - pad <= viewport.y + viewport.height
  );
}

/** True when a point is inside the viewport, expanded by `margin`. */
export function isPointVisible(
  x: number,
  y: number,
  viewport: Viewport,
  margin = CULL_MARGIN
): boolean {
  return isCircleVisible(x, y, 0, viewport, margin);
}

/**
 * Level of detail band for an entity, derived from zoom.
 *
 * The docs call for "distant ships = simpler sprites". At low zoom individual
 * ships are sub-pixel, so they are drawn as plain dots.
 */
export const LOD_LEVELS = ['dot', 'simple', 'full'] as const;
export type LodLevel = (typeof LOD_LEVELS)[number];

/** Zoom below which ships collapse to dots. */
export const LOD_DOT_ZOOM = 0.12;

/** Zoom below which ships lose their detail overlays. */
export const LOD_SIMPLE_ZOOM = 0.45;

/** Chooses a level of detail for the current zoom. */
export function lodForZoom(zoom: number): LodLevel {
  if (zoom < LOD_DOT_ZOOM) return 'dot';
  if (zoom < LOD_SIMPLE_ZOOM) return 'simple';
  return 'full';
}

/** True when health bars are worth drawing at this zoom. */
export function shouldDrawHealthBars(zoom: number): boolean {
  return zoom >= LOD_SIMPLE_ZOOM;
}

/** True when engine trails are worth drawing at this zoom. */
export function shouldDrawTrails(zoom: number): boolean {
  return zoom >= LOD_DOT_ZOOM;
}
