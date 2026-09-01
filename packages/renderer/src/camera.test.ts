import { describe, expect, it } from 'vitest';

import { MAX_ZOOM, MIN_ZOOM, WORLD_HEIGHT, WORLD_WIDTH } from '@fleet-strike/config';

import { Camera } from './camera';

/** A viewport small enough that the camera is free to pan on both axes. */
function camera(): Camera {
  return new Camera(1600, 900);
}

describe('Camera construction', () => {
  it('starts centred on the world', () => {
    const cam = camera();
    expect(cam.x).toBeCloseTo(WORLD_WIDTH / 2, 4);
    expect(cam.y).toBeCloseTo(WORLD_HEIGHT / 2, 4);
  });

  it('rejects a degenerate viewport size', () => {
    const cam = new Camera(0, 0);
    expect(cam.width).toBeGreaterThan(0);
    expect(cam.height).toBeGreaterThan(0);
  });
});

describe('coordinate conversion', () => {
  it('maps the camera centre to the middle of the screen', () => {
    const cam = camera();
    const screen = cam.worldToScreen(cam.x, cam.y);
    expect(screen.x).toBeCloseTo(800, 4);
    expect(screen.y).toBeCloseTo(450, 4);
  });

  it('round-trips world to screen and back', () => {
    const cam = camera();
    const world = { x: 4321, y: 2222 };
    const screen = cam.worldToScreen(world.x, world.y);
    const back = cam.screenToWorld(screen.x, screen.y);
    expect(back.x).toBeCloseTo(world.x, 3);
    expect(back.y).toBeCloseTo(world.y, 3);
  });

  it('scales distance by zoom', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);

    const a = cam.worldToScreen(cam.x, cam.y);
    const b = cam.worldToScreen(cam.x + 100, cam.y);
    expect(b.x - a.x).toBeCloseTo(100, 3);
  });
});

describe('zoom', () => {
  it('clamps to the configured bounds', () => {
    const cam = camera();
    cam.setZoom(9999);
    cam.update(10);
    expect(cam.zoom).toBeLessThanOrEqual(MAX_ZOOM + 1e-6);

    cam.setZoom(-5);
    cam.update(10);
    expect(cam.zoom).toBeGreaterThanOrEqual(MIN_ZOOM - 1e-6);
  });

  it('keeps the world point under the cursor fixed while zooming', () => {
    const cam = camera();
    cam.setZoom(0.5);
    cam.update(10);

    const anchorScreen = { x: 400, y: 300 };
    const before = cam.screenToWorld(anchorScreen.x, anchorScreen.y);

    cam.zoomAt(1.5, anchorScreen.x, anchorScreen.y);

    const after = cam.screenToWorld(anchorScreen.x, anchorScreen.y);
    expect(after.x).toBeCloseTo(before.x, 1);
    expect(after.y).toBeCloseTo(before.y, 1);
  });

  it('fits the whole world on screen', () => {
    const cam = camera();
    cam.fitToWorld();
    cam.update(10);

    const viewport = cam.getViewport();
    expect(viewport.width).toBeGreaterThanOrEqual(WORLD_WIDTH - 1);
    expect(viewport.height).toBeGreaterThanOrEqual(WORLD_HEIGHT - 1);
  });
});

describe('panning and clamping', () => {
  it('pans by a screen delta in the opposite direction', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);
    const before = cam.x;

    // Dragging right moves the camera left over the world.
    cam.panByScreen(100, 0);
    cam.update(10);

    expect(cam.x).toBeLessThan(before);
  });

  it('never shows space outside the world', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);

    cam.snapTo(-99999, -99999);
    cam.update(10);
    let viewport = cam.getViewport();
    expect(viewport.x).toBeGreaterThanOrEqual(-1);
    expect(viewport.y).toBeGreaterThanOrEqual(-1);

    cam.snapTo(99999, 99999);
    cam.update(10);
    viewport = cam.getViewport();
    expect(viewport.x + viewport.width).toBeLessThanOrEqual(WORLD_WIDTH + 1);
    expect(viewport.y + viewport.height).toBeLessThanOrEqual(WORLD_HEIGHT + 1);
  });

  it('locks to the world centre on an axis the view overflows', () => {
    const cam = camera();
    // Zoomed far out, the view is wider than the world.
    cam.setZoom(MIN_ZOOM);
    cam.update(10);
    cam.snapTo(0, 0);
    cam.update(10);

    expect(cam.x).toBeCloseTo(WORLD_WIDTH / 2, 0);
  });
});

describe('easing', () => {
  it('eases toward the target rather than jumping', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);
    cam.snapTo(5000, 3000);

    cam.moveTo(9000, 3000);
    cam.update(1 / 60);

    // Moved, but nowhere near all the way.
    expect(cam.x).toBeGreaterThan(5000);
    expect(cam.x).toBeLessThan(9000);
  });

  it('converges on the target given enough time', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);
    cam.moveTo(9000, 3000);

    for (let i = 0; i < 600; i += 1) cam.update(1 / 60);

    expect(cam.x).toBeCloseTo(9000, 0);
  });

  it('snapTo moves immediately', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);
    cam.snapTo(7000, 3200);
    expect(cam.x).toBeCloseTo(7000, 4);
    expect(cam.y).toBeCloseTo(3200, 4);
  });
});

describe('resize', () => {
  it('updates the viewport dimensions', () => {
    const cam = camera();
    cam.resize(800, 600);
    expect(cam.width).toBe(800);
    expect(cam.height).toBe(600);
  });

  it('keeps the view inside the world after shrinking zoom-out room', () => {
    const cam = camera();
    cam.setZoom(1);
    cam.update(10);
    cam.resize(3000, 2000);
    const viewport = cam.getViewport();
    expect(viewport.x).toBeGreaterThanOrEqual(-1);
  });
});
