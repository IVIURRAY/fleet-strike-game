/**
 * Mouse and keyboard input.
 *
 * Controls follow docs/MVP_Design.md: left click sets the waypoint or selects a
 * planet, drag pans, and the wheel zooms. A click is distinguished from a drag
 * by distance travelled, so panning never accidentally issues a command.
 */

import { PLANETS, ZOOM_STEP } from '@fleet-strike/config';
import type { Camera } from '@fleet-strike/renderer';
import { distance } from '@fleet-strike/utils';

/** Pixels of movement above which a press is treated as a drag, not a click. */
const DRAG_THRESHOLD = 6;

/** Callbacks the input layer raises. */
export interface InputHandlers {
  /** A planet was clicked. */
  onSelectPlanet(planetIndex: number): void;
  /** Empty space was clicked; set the fleet waypoint here. */
  onSetWaypoint(worldX: number, worldY: number): void;
  /** The selection should be cleared. */
  onClearSelection(): void;
}

/** Attaches input listeners and returns a teardown function. */
export function attachInput(
  canvas: HTMLElement,
  camera: Camera,
  handlers: InputHandlers
): () => void {
  let isPointerDown = false;
  let dragDistance = 0;
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (event: PointerEvent): void => {
    // Ignore anything but the primary button; right click is reserved.
    if (event.button !== 0) return;
    isPointerDown = true;
    dragDistance = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!isPointerDown) return;

    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    dragDistance += Math.hypot(dx, dy);
    lastX = event.clientX;
    lastY = event.clientY;

    camera.panByScreen(dx, dy);
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!isPointerDown) return;
    isPointerDown = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    // A drag is a camera pan, not a command.
    if (dragDistance > DRAG_THRESHOLD) return;

    const rect = canvas.getBoundingClientRect();
    const world = camera.screenToWorld(event.clientX - rect.left, event.clientY - rect.top);

    const planetIndex = findPlanetAt(world.x, world.y);
    if (planetIndex !== null) {
      handlers.onSelectPlanet(planetIndex);
      return;
    }

    handlers.onClearSelection();
    handlers.onSetWaypoint(world.x, world.y);
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    camera.zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      handlers.onClearSelection();
      return;
    }
    // Frame the whole galaxy, useful once fleets are spread out.
    if (event.key === 'f' || event.key === 'F') {
      camera.fitToWorld();
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeyDown);
  };
}

/**
 * Returns the planet under a world position, or `null`.
 *
 * The hit radius is padded so planets stay clickable when zoomed out.
 */
export function findPlanetAt(worldX: number, worldY: number, padding = 60): number | null {
  for (const planet of PLANETS) {
    if (distance(worldX, worldY, planet.x, planet.y) <= planet.radius + padding) {
      return planet.index;
    }
  }
  return null;
}
