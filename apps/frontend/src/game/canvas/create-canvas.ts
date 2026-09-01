/**
 * PixiJS application setup.
 *
 * docs/Technical_Architecture.md calls for WebGPU with a WebGL fallback. PixiJS
 * 8 handles that automatically via `preference`, falling back on its own when
 * WebGPU is unavailable.
 */

import { Application, Container } from 'pixi.js';
import { COLORS } from '@fleet-strike/config';

/** The layered scene graph. Layers are added in draw order. */
export interface SceneLayers {
  readonly background: Container;
  readonly lanes: Container;
  readonly planets: Container;
  readonly moons: Container;
  readonly buildings: Container;
  readonly ships: Container;
  readonly projectiles: Container;
  readonly effects: Container;
  readonly overlays: Container;
}

/** A ready-to-use renderer. */
export interface GameCanvas {
  readonly app: Application;
  /** Pans and zooms with the camera; everything in world space lives here. */
  readonly world: Container;
  readonly layers: SceneLayers;
  readonly rendererType: string;
}

/** Creates the PixiJS application and attaches it to `parent`. */
export async function createGameCanvas(parent: HTMLElement): Promise<GameCanvas> {
  const app = new Application();

  await app.init({
    resizeTo: parent,
    background: COLORS.spaceBackground,
    antialias: true,
    // Cap at 2 so 3x phone displays do not quadruple the fill cost.
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
    preference: 'webgpu',
    powerPreference: 'high-performance',
  });

  parent.appendChild(app.canvas);

  const world = new Container();
  // Layer sorting is fixed by insertion order, so per-frame sorting is off.
  world.sortableChildren = false;

  const layers: SceneLayers = {
    background: new Container(),
    lanes: new Container(),
    planets: new Container(),
    moons: new Container(),
    buildings: new Container(),
    ships: new Container(),
    projectiles: new Container(),
    effects: new Container(),
    overlays: new Container(),
  };

  world.addChild(
    layers.background,
    layers.lanes,
    layers.planets,
    layers.moons,
    layers.buildings,
    layers.ships,
    layers.projectiles,
    layers.effects,
    layers.overlays
  );

  app.stage.addChild(world);

  return {
    app,
    world,
    layers,
    rendererType: app.renderer.type === 1 ? 'WebGL' : 'WebGPU',
  };
}
