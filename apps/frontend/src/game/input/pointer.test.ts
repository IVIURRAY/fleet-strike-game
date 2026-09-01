import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Camera } from '@fleet-strike/renderer';
import { PLANETS } from '@fleet-strike/config';

import { attachInput } from './pointer';

/** Builds a canvas stub with the pointer-capture API jsdom lacks. */
function makeCanvas(): HTMLElement {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1600, height: 900 }) as DOMRect;
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  element.hasPointerCapture = vi.fn(() => true);
  return element;
}

/** Dispatches a pointer event; jsdom has no PointerEvent constructor. */
function pointer(
  target: HTMLElement,
  type: string,
  clientX: number,
  clientY: number,
  button = 0
): void {
  const event = new MouseEvent(type, { clientX, clientY, button, bubbles: true });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
}

describe('attachInput click handling', () => {
  let canvas: HTMLElement;
  let camera: Camera;
  let selected: number[];
  let waypoints: Array<{ x: number; y: number }>;
  let cleared: number;
  let detach: () => void;

  beforeEach(() => {
    canvas = makeCanvas();
    camera = new Camera(1600, 900);
    selected = [];
    waypoints = [];
    cleared = 0;

    detach = attachInput(canvas, camera, {
      onSelectPlanet: (index) => selected.push(index),
      onSetWaypoint: (x, y) => waypoints.push({ x, y }),
      onClearSelection: () => {
        cleared += 1;
      },
    });
  });

  it('selects a planet when clicked', () => {
    // Centre the camera on a planet so its screen position is the view centre.
    const planet = PLANETS[3]!;
    camera.snapTo(planet.x, planet.y);

    pointer(canvas, 'pointerdown', 800, 450);
    pointer(canvas, 'pointerup', 800, 450);

    expect(selected).toEqual([3]);
    expect(waypoints).toHaveLength(0);
    detach();
  });

  it('sets a waypoint when empty space is clicked', () => {
    // Park the camera midway between two planets.
    const a = PLANETS[0]!;
    const b = PLANETS[1]!;
    camera.snapTo((a.x + b.x) / 2, a.y);

    pointer(canvas, 'pointerdown', 800, 450);
    pointer(canvas, 'pointerup', 800, 450);

    expect(waypoints).toHaveLength(1);
    expect(selected).toHaveLength(0);
    expect(cleared).toBe(1);
    detach();
  });

  it('treats a drag as a camera pan, not a command', () => {
    const planet = PLANETS[3]!;
    camera.snapTo(planet.x, planet.y);
    const startX = camera.x;

    pointer(canvas, 'pointerdown', 800, 450);
    pointer(canvas, 'pointermove', 700, 450);
    pointer(canvas, 'pointermove', 600, 450);
    pointer(canvas, 'pointerup', 600, 450);

    // No command was issued, but the camera target moved.
    expect(selected).toHaveLength(0);
    expect(waypoints).toHaveLength(0);

    camera.update(1);
    expect(camera.x).not.toBeCloseTo(startX, 3);
    detach();
  });

  it('still fires a click after a tiny jitter below the drag threshold', () => {
    const planet = PLANETS[3]!;
    camera.snapTo(planet.x, planet.y);

    pointer(canvas, 'pointerdown', 800, 450);
    pointer(canvas, 'pointermove', 801, 450);
    pointer(canvas, 'pointerup', 801, 450);

    expect(selected).toEqual([3]);
    detach();
  });

  it('ignores non-primary buttons, which are reserved', () => {
    pointer(canvas, 'pointerdown', 800, 450, 2);
    pointer(canvas, 'pointerup', 800, 450, 2);

    expect(selected).toHaveLength(0);
    expect(waypoints).toHaveLength(0);
    detach();
  });

  it('ignores movement without a preceding press', () => {
    const before = camera.x;
    pointer(canvas, 'pointermove', 100, 100);
    camera.update(1);
    expect(camera.x).toBeCloseTo(before, 3);
    detach();
  });
});

describe('attachInput zoom and keys', () => {
  it('zooms in on wheel up and out on wheel down', () => {
    const canvas = makeCanvas();
    const camera = new Camera(1600, 900);
    const detach = attachInput(canvas, camera, {
      onSelectPlanet: () => {},
      onSetWaypoint: () => {},
      onClearSelection: () => {},
    });

    camera.setZoom(0.5);
    camera.update(10);
    const before = camera.zoom;

    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: 800, clientY: 450 }));
    camera.update(10);
    expect(camera.zoom).toBeGreaterThan(before);

    const zoomedIn = camera.zoom;
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, clientX: 800, clientY: 450 }));
    camera.update(10);
    expect(camera.zoom).toBeLessThan(zoomedIn);

    detach();
  });

  it('clears the selection on Escape', () => {
    const canvas = makeCanvas();
    const camera = new Camera(1600, 900);
    let cleared = 0;
    const detach = attachInput(canvas, camera, {
      onSelectPlanet: () => {},
      onSetWaypoint: () => {},
      onClearSelection: () => {
        cleared += 1;
      },
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cleared).toBe(1);
    detach();
  });

  it('frames the galaxy on F', () => {
    const canvas = makeCanvas();
    const camera = new Camera(1600, 900);
    const detach = attachInput(canvas, camera, {
      onSelectPlanet: () => {},
      onSetWaypoint: () => {},
      onClearSelection: () => {},
    });

    camera.setZoom(2);
    camera.update(10);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
    camera.update(10);

    expect(camera.zoom).toBeCloseTo(camera.fitZoom(), 2);
    detach();
  });

  it('removes every listener on detach', () => {
    const canvas = makeCanvas();
    const camera = new Camera(1600, 900);
    let cleared = 0;
    const detach = attachInput(canvas, camera, {
      onSelectPlanet: () => {},
      onSetWaypoint: () => {},
      onClearSelection: () => {
        cleared += 1;
      },
    });

    detach();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    pointer(canvas, 'pointerdown', 800, 450);
    pointer(canvas, 'pointerup', 800, 450);

    expect(cleared).toBe(0);
  });
});
