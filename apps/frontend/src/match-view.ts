/**
 * The in-match view.
 *
 * Owns the PixiJS scene, the camera, input bindings and the render loop. Split
 * from `App` so the application shell deals only with screens and networking.
 */

import { Graphics } from 'pixi.js';
import type { BuildingType, PlayerId } from '@fleet-strike/types';
import { CAPITAL_INDEX, PLANETS, TEAM_COLORS } from '@fleet-strike/config';
import { Camera, createWaypointSprite } from '@fleet-strike/renderer';

import { createGameCanvas } from './game/canvas/create-canvas';
import type { GameCanvas } from './game/canvas/create-canvas';
import { EffectsRenderer } from './game/graphics/effects-renderer';
import { EntityRenderer } from './game/graphics/entity-renderer';
import {
  buildStaticScene,
  setSelectedPlanet,
  updateStaticScene,
} from './game/graphics/static-scene';
import type { StaticScene } from './game/graphics/static-scene';
import { attachInput } from './game/input/pointer';
import type { GameStore } from './game/state/store';
import { renderBuildPanel } from './ui/hud/build-panel';
import type { BuildSelection } from './ui/hud/build-panel';
import type { HudElements } from './ui/hud/hud';
import { drawMinimap, minimapToWorld } from './ui/hud/minimap';
import { updateHud } from './ui/hud/update-hud';

/** Commands the match view sends upstream. */
export interface MatchViewHandlers {
  onSetWaypoint(x: number, y: number): void;
  onBuild(planetIndex: number, moonId: string | null, buildingType: BuildingType): void;
  onUpgrade(buildingId: number): void;
}

export class MatchView {
  private canvas: GameCanvas | null = null;
  private camera: Camera | null = null;
  private scene: StaticScene | null = null;
  private entities: EntityRenderer | null = null;
  private effects: EffectsRenderer | null = null;
  private waypointMarker: Graphics | null = null;
  private selectionHighlight: Graphics | null = null;
  private detachInput: (() => void) | null = null;
  private onResize: (() => void) | null = null;

  private selection: BuildSelection = { planetIndex: null, moonId: null };
  /** Rebuild the build panel only when something it depends on changed. */
  private buildPanelDirty = true;
  private lastPanelSignature = '';

  private frameCount = 0;
  private fpsAccumulator = 0;
  private fps = 0;

  constructor(
    private readonly hud: HudElements,
    private readonly store: GameStore,
    private readonly handlers: MatchViewHandlers
  ) {}

  /** Builds the scene and starts the render loop. */
  async mount(): Promise<void> {
    const canvas = await createGameCanvas(this.hud.arena);
    this.canvas = canvas;

    const camera = new Camera(canvas.app.screen.width, canvas.app.screen.height);
    this.camera = camera;

    // Open on the player's own capital so they start with context.
    const capital = PLANETS[CAPITAL_INDEX[(this.store.playerId ?? 1) as PlayerId]];
    if (capital !== undefined) camera.snapTo(capital.x, capital.y);

    this.scene = buildStaticScene(canvas.layers);
    this.entities = new EntityRenderer(canvas.layers);
    this.effects = new EffectsRenderer(canvas.layers);

    this.waypointMarker = createWaypointSprite(TEAM_COLORS[(this.store.playerId ?? 1) as PlayerId]);
    this.waypointMarker.alpha = 0.7;
    canvas.layers.overlays.addChild(this.waypointMarker);

    this.selectionHighlight = new Graphics();
    canvas.layers.overlays.addChild(this.selectionHighlight);

    this.detachInput = attachInput(canvas.app.canvas, camera, {
      onSelectPlanet: (planetIndex: number): void => {
        this.selection = { planetIndex, moonId: null };
        this.buildPanelDirty = true;
      },
      onSetWaypoint: (x: number, y: number): void => this.handlers.onSetWaypoint(x, y),
      onClearSelection: (): void => {
        if (this.selection.planetIndex === null) return;
        this.selection = { planetIndex: null, moonId: null };
        this.buildPanelDirty = true;
      },
    });

    this.hud.minimap.addEventListener('click', (event: MouseEvent): void => {
      const world = minimapToWorld(this.hud.minimap, event.clientX, event.clientY);
      camera.moveTo(world.x, world.y);
    });

    this.onResize = (): void => {
      camera.resize(canvas.app.screen.width, canvas.app.screen.height);
    };
    window.addEventListener('resize', this.onResize);

    canvas.app.ticker.add((ticker): void => this.renderFrame(ticker.deltaMS / 1000));
  }

  /** Forwards server events to the effects layer. */
  handleEvents(events: Parameters<EffectsRenderer['handleEvents']>[0]): void {
    this.effects?.handleEvents(events);
  }

  /** Forces a build panel rebuild, e.g. after a capture. */
  invalidateBuildPanel(): void {
    this.buildPanelDirty = true;
  }

  /** Tears down the scene and removes listeners. */
  destroy(): void {
    this.detachInput?.();
    this.detachInput = null;

    if (this.onResize !== null) {
      window.removeEventListener('resize', this.onResize);
      this.onResize = null;
    }

    this.entities?.clear();
    this.effects?.clear();
    this.canvas?.app.destroy(true, { children: true });

    this.canvas = null;
    this.camera = null;
    this.scene = null;
    this.entities = null;
    this.effects = null;
    this.waypointMarker = null;
    this.selectionHighlight = null;
  }

  private renderFrame(deltaTime: number): void {
    const { canvas, camera, scene, entities, effects, hud, store } = this;
    if (canvas === null || camera === null || scene === null) return;
    if (entities === null || effects === null) return;

    camera.update(deltaTime);
    store.advance(deltaTime);

    // Apply the camera as a transform on the world container.
    canvas.world.scale.set(camera.zoom);
    canvas.world.x = canvas.app.screen.width / 2 - camera.x * camera.zoom;
    canvas.world.y = canvas.app.screen.height / 2 - camera.y * camera.zoom;

    const viewport = camera.getViewport();

    updateStaticScene(scene, store);
    entities.render(store, viewport, camera.zoom);
    effects.update(deltaTime);

    const me = store.me;
    if (this.waypointMarker !== null && me !== null) {
      this.waypointMarker.x = me.waypoint.x;
      this.waypointMarker.y = me.waypoint.y;
    }

    if (this.selectionHighlight !== null) {
      setSelectedPlanet(this.selectionHighlight, this.selection.planetIndex);
    }

    updateHud(hud, store);
    drawMinimap(hud.minimap, store, camera);
    this.refreshBuildPanel();
    this.updatePerfChip(deltaTime, entities, effects);
  }

  /**
   * Rebuilds the build panel only when its inputs change.
   *
   * Regenerating this DOM every frame would be wasteful and would fight the
   * user's scroll position and hover state.
   */
  private refreshBuildPanel(): void {
    const me = this.store.me;
    const signature = [
      this.selection.planetIndex,
      this.selection.moonId,
      me?.resources.gold,
      me?.resources.crystal,
      me?.resources.gas,
      me?.resources.tungsten,
      this.store.buildings.length,
      this.selection.planetIndex === null
        ? ''
        : this.store.planetAt(this.selection.planetIndex)?.owner,
    ].join('|');

    if (!this.buildPanelDirty && signature === this.lastPanelSignature) return;
    this.buildPanelDirty = false;
    this.lastPanelSignature = signature;

    renderBuildPanel(this.hud, this.store, this.selection, {
      onBuild: (planetIndex, moonId, buildingType): void =>
        this.handlers.onBuild(planetIndex, moonId, buildingType),
      onUpgrade: (buildingId): void => this.handlers.onUpgrade(buildingId),
      onSelectMoon: (moonId): void => {
        this.selection = { planetIndex: this.selection.planetIndex, moonId };
        this.buildPanelDirty = true;
      },
    });
  }

  private updatePerfChip(
    deltaTime: number,
    entities: EntityRenderer,
    effects: EffectsRenderer
  ): void {
    this.frameCount += 1;
    this.fpsAccumulator += deltaTime;
    if (this.fpsAccumulator < 0.5) return;

    this.fps = Math.round(this.frameCount / this.fpsAccumulator);
    this.frameCount = 0;
    this.fpsAccumulator = 0;

    this.hud.perfChip.textContent =
      `${this.fps} fps · ${entities.shipSpriteCount} ships · ` +
      `${effects.particleCount} fx · ${this.canvas?.rendererType ?? ''}`;
  }
}
