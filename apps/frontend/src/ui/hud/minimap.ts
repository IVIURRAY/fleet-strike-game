/**
 * Minimap.
 *
 * Drawn on a plain 2D canvas rather than in the PixiJS scene, because it lives
 * in screen space and needs no camera transform. Shows all seven planets with
 * ownership colours, fleet positions, the waypoint and the current viewport.
 */

import {
  OWNER_COLORS,
  PLANETS,
  TEAM_COLORS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '@fleet-strike/config';
import type { Camera } from '@fleet-strike/renderer';

import type { GameStore } from '../../game/state/store';

/** Converts a packed colour to a CSS string. */
function css(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Redraws the minimap. */
export function drawMinimap(canvas: HTMLCanvasElement, store: GameStore, camera: Camera): void {
  const context = canvas.getContext('2d');
  if (context === null) return;

  const { width, height } = canvas;
  const scaleX = width / WORLD_WIDTH;
  const scaleY = height / WORLD_HEIGHT;

  context.clearRect(0, 0, width, height);
  context.fillStyle = 'rgba(1,1,8,0.85)';
  context.fillRect(0, 0, width, height);

  // Trade lanes.
  context.strokeStyle = css(TEAM_COLORS[1], 0.18);
  context.lineWidth = 1;
  context.beginPath();
  for (let i = 1; i < PLANETS.length; i += 1) {
    const from = PLANETS[i - 1];
    const to = PLANETS[i];
    if (from === undefined || to === undefined) continue;
    context.moveTo(from.x * scaleX, from.y * scaleY);
    context.lineTo(to.x * scaleX, to.y * scaleY);
  }
  context.stroke();

  // Ships, drawn before planets so planets stay legible.
  for (const ship of store.ships.values()) {
    context.fillStyle = css(TEAM_COLORS[ship.owner], 0.85);
    context.fillRect(ship.x * scaleX - 1, ship.y * scaleY - 1, 2, 2);
  }

  // Planets.
  for (const planet of PLANETS) {
    const state = store.planetAt(planet.index);
    const owner = state?.owner ?? 0;
    const radius = Math.max(3, planet.radius * scaleX * 1.6);

    context.beginPath();
    context.arc(planet.x * scaleX, planet.y * scaleY, radius, 0, Math.PI * 2);
    context.fillStyle = css(OWNER_COLORS[owner], 0.9);
    context.fill();

    // Ring contested planets so fights are visible at a glance.
    if (state !== undefined && (state.presence[1] > 0 || state.presence[2] > 0)) {
      context.strokeStyle = 'rgba(255,255,255,0.8)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(planet.x * scaleX, planet.y * scaleY, radius + 2.5, 0, Math.PI * 2);
      context.stroke();
    }
  }

  // The local player's waypoint.
  const me = store.me;
  if (me !== null) {
    const x = me.waypoint.x * scaleX;
    const y = me.waypoint.y * scaleY;
    context.strokeStyle = css(TEAM_COLORS[me.id], 0.95);
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x - 4, y);
    context.lineTo(x + 4, y);
    context.moveTo(x, y - 4);
    context.lineTo(x, y + 4);
    context.stroke();
  }

  // Current viewport rectangle.
  const viewport = camera.getViewport();
  context.strokeStyle = 'rgba(255,255,255,0.4)';
  context.lineWidth = 1;
  context.strokeRect(
    viewport.x * scaleX,
    viewport.y * scaleY,
    viewport.width * scaleX,
    viewport.height * scaleY
  );
}

/** Converts a click on the minimap into a world position. */
export function minimapToWorld(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const fx = (clientX - rect.left) / rect.width;
  const fy = (clientY - rect.top) / rect.height;
  return { x: fx * WORLD_WIDTH, y: fy * WORLD_HEIGHT };
}
