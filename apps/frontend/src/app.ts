/**
 * Application shell.
 *
 * Owns the screen state machine (menu -> waiting -> match -> result), the
 * network client, the PixiJS scene and the render loop.
 */

import { Camera } from '@fleet-strike/renderer';
import type { BuildingType, GameEvent, PlayerId, ServerMessage } from '@fleet-strike/types';
import { CAPITAL_INDEX, PLANETS, TEAM_COLORS } from '@fleet-strike/config';
import { createWaypointSprite } from '@fleet-strike/renderer';
import { Graphics } from 'pixi.js';

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
import { GameStore } from './game/state/store';
import { NetworkClient } from './network/client';
import { renderBuildPanel } from './ui/hud/build-panel';
import type { BuildSelection } from './ui/hud/build-panel';
import { createHud, showToast } from './ui/hud/hud';
import type { HudElements } from './ui/hud/hud';
import { drawMinimap, minimapToWorld } from './ui/hud/minimap';
import { updateHud } from './ui/hud/update-hud';
import {
  createConnectingScreen,
  createMenuScreen,
  createResultScreen,
  createWaitingScreen,
  setMenuError,
} from './ui/screens/menu';

export class App {
  private readonly root: HTMLElement;
  private readonly store = new GameStore();
  private readonly network: NetworkClient;

  private screen: HTMLElement | null = null;
  private hud: HudElements | null = null;
  private canvas: GameCanvas | null = null;
  private camera: Camera | null = null;
  private scene: StaticScene | null = null;
  private entities: EntityRenderer | null = null;
  private effects: EffectsRenderer | null = null;
  private waypointMarker: Graphics | null = null;
  private selectionHighlight: Graphics | null = null;
  private detachInput: (() => void) | null = null;

  private selection: BuildSelection = { planetIndex: null, moonId: null };
  /** Rebuild the build panel only when something it depends on changed. */
  private buildPanelDirty = true;
  private lastPanelSignature = '';

  private pendingName = 'Captain';
  private frameCount = 0;
  private fpsAccumulator = 0;
  private fps = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.network = new NetworkClient({
      onMessage: (message) => this.handleServerMessage(message),
      onStateChange: (state) => {
        if (state === 'error' || state === 'closed') {
          if (this.hud === null && this.screen !== null) {
            setMenuError(this.screen, 'Lost contact with the server. Is it running?');
          }
        }
      },
    });
  }

  /** Shows the main menu. */
  start(): void {
    this.showMenu();
  }

  // --- Screens -------------------------------------------------------------

  private showMenu(): void {
    this.teardownMatch();
    this.store.reset();

    const screen = createMenuScreen({
      onCreateRoom: (name) => {
        this.pendingName = name.length > 0 ? name : 'Captain';
        this.showConnecting();
        this.network.send({ type: 'CREATE_ROOM', playerName: this.pendingName });
      },
      onJoinRoom: (code, name) => {
        this.pendingName = name.length > 0 ? name : 'Captain';
        this.showConnecting();
        this.network.send({ type: 'JOIN_ROOM', code, playerName: this.pendingName });
      },
    });

    this.setScreen(screen);
    this.network.connect();
  }

  private showConnecting(): void {
    this.setScreen(createConnectingScreen());
  }

  private showWaiting(code: string): void {
    this.setScreen(
      createWaitingScreen(code, () => {
        this.network.send({ type: 'LEAVE_ROOM' });
        this.showMenu();
      })
    );
  }

  private setScreen(screen: HTMLElement | null): void {
    this.screen?.remove();
    this.screen = screen;
    if (screen !== null) this.root.appendChild(screen);
  }

  // --- Network -------------------------------------------------------------

  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'ROOM_CREATED':
        this.store.playerId = message.playerId;
        this.store.roomCode = message.code;
        this.showWaiting(message.code);
        return;

      case 'ROOM_JOINED':
        this.store.playerId = message.playerId;
        this.store.roomCode = message.code;
        this.showWaiting(message.code);
        return;

      case 'MATCH_STARTED':
        this.store.applySnapshot(message.snapshot);
        this.store.setupRemaining = message.setupSeconds;
        void this.enterMatch();
        return;

      case 'FULL_STATE':
        this.store.applySnapshot(message.snapshot);
        this.buildPanelDirty = true;
        return;

      case 'STATE_UPDATE':
        this.store.applyUpdate(message);
        return;

      case 'GAME_EVENTS':
        this.handleGameEvents(message.events);
        return;

      case 'MATCH_ENDED':
        this.store.result = message.result;
        this.showResult();
        return;

      case 'ERROR':
        if (this.hud !== null) {
          showToast(this.hud, message.message, true);
        } else if (this.screen !== null) {
          setMenuError(this.screen, message.message);
          // A failed create or join leaves the player stuck on the connecting
          // panel, so return them to the menu with the error visible.
          if (message.code !== 'RATE_LIMITED') this.showMenuWithError(message.message);
        }
        return;

      default:
        return;
    }
  }

  private showMenuWithError(message: string): void {
    this.showMenu();
    if (this.screen !== null) setMenuError(this.screen, message);
  }

  private handleGameEvents(events: readonly GameEvent[]): void {
    this.effects?.handleEvents(events);
    if (this.hud === null) return;

    for (const event of events) {
      if (event.type === 'COMMAND_REJECTED') {
        showToast(this.hud, event.reason, true);
        continue;
      }
      if (event.type === 'PLANET_CAPTURED') {
        const planet = PLANETS[event.planetIndex];
        if (planet === undefined) continue;
        const mine = event.newOwner === this.store.playerId;
        showToast(
          this.hud,
          mine ? `${planet.name} captured` : `${planet.name} lost`,
          !mine
        );
        this.buildPanelDirty = true;
        continue;
      }
      if (event.type === 'BUILDING_COMPLETED' && event.owner === this.store.playerId) {
        this.buildPanelDirty = true;
      }
    }
  }

  // --- Match ---------------------------------------------------------------

  private async enterMatch(): Promise<void> {
    if (this.hud !== null) return;

    this.setScreen(null);

    const hud = createHud(this.store.roomCode ?? '------');
    this.hud = hud;
    this.root.replaceChildren(hud.root);

    const canvas = await createGameCanvas(hud.arena);
    this.canvas = canvas;

    const camera = new Camera(canvas.app.screen.width, canvas.app.screen.height);
    this.camera = camera;

    // Open on the player's own capital so they start with context.
    const capital = PLANETS[CAPITAL_INDEX[this.store.playerId ?? 1]];
    if (capital !== undefined) camera.snapTo(capital.x, capital.y);

    this.scene = buildStaticScene(canvas.layers);
    this.entities = new EntityRenderer(canvas.layers);
    this.effects = new EffectsRenderer(canvas.layers);

    this.waypointMarker = createWaypointSprite(TEAM_COLORS[this.store.playerId ?? 1]);
    this.waypointMarker.alpha = 0.7;
    canvas.layers.overlays.addChild(this.waypointMarker);

    this.selectionHighlight = new Graphics();
    canvas.layers.overlays.addChild(this.selectionHighlight);

    this.detachInput = attachInput(canvas.app.canvas, camera, {
      onSelectPlanet: (planetIndex) => {
        this.selection = { planetIndex, moonId: null };
        this.buildPanelDirty = true;
      },
      onSetWaypoint: (x, y) => {
        this.network.send({ type: 'SET_WAYPOINT', x, y });
      },
      onClearSelection: () => {
        if (this.selection.planetIndex === null) return;
        this.selection = { planetIndex: null, moonId: null };
        this.buildPanelDirty = true;
      },
    });

    hud.minimap.addEventListener('click', (event) => {
      const world = minimapToWorld(hud.minimap, event.clientX, event.clientY);
      camera.moveTo(world.x, world.y);
    });

    window.addEventListener('resize', () => {
      camera.resize(canvas.app.screen.width, canvas.app.screen.height);
    });

    canvas.app.ticker.add((ticker) => {
      this.renderFrame(ticker.deltaMS / 1000);
    });
  }

  private renderFrame(deltaTime: number): void {
    const { canvas, camera, scene, entities, effects, hud } = this;
    if (canvas === null || camera === null || scene === null) return;
    if (entities === null || effects === null || hud === null) return;

    camera.update(deltaTime);
    this.store.advance(deltaTime);

    // Apply the camera as a transform on the world container.
    canvas.world.scale.set(camera.zoom);
    canvas.world.x = canvas.app.screen.width / 2 - camera.x * camera.zoom;
    canvas.world.y = canvas.app.screen.height / 2 - camera.y * camera.zoom;

    const viewport = camera.getViewport();

    updateStaticScene(scene, this.store);
    entities.render(this.store, viewport, camera.zoom);
    effects.update(deltaTime);

    const me = this.store.me;
    if (this.waypointMarker !== null && me !== null) {
      this.waypointMarker.x = me.waypoint.x;
      this.waypointMarker.y = me.waypoint.y;
    }

    if (this.selectionHighlight !== null) {
      setSelectedPlanet(this.selectionHighlight, this.selection.planetIndex);
    }

    updateHud(hud, this.store);
    drawMinimap(hud.minimap, this.store, camera);
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
    const hud = this.hud;
    if (hud === null) return;

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

    renderBuildPanel(hud, this.store, this.selection, {
      onBuild: (planetIndex, moonId, buildingType: BuildingType) => {
        this.network.send({ type: 'BUILD_STRUCTURE', planetIndex, moonId, buildingType });
      },
      onUpgrade: (buildingId) => {
        this.network.send({ type: 'UPGRADE_BUILDING', buildingId });
      },
      onSelectMoon: (moonId) => {
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
    if (this.fpsAccumulator >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsAccumulator);
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }

    if (this.hud === null) return;
    this.hud.perfChip.textContent = `${this.fps} fps · ${entities.shipSpriteCount} ships · ${effects.particleCount} fx · ${this.canvas?.rendererType ?? ''}`;
  }

  private showResult(): void {
    const result = this.store.result;
    if (result === null) return;

    const isWinner = result.winner === this.store.playerId;
    const headline =
      result.winner === null ? 'Stalemate' : isWinner ? 'Victory' : 'Defeat';

    const reason =
      result.reason === 'conquest'
        ? 'Total planetary conquest.'
        : result.reason === 'forfeit'
          ? 'Your rival withdrew from the battle.'
          : 'Time expired; the fleet holding more worlds prevails.';

    const held = result.planetsHeld[(this.store.playerId ?? 1) as PlayerId];
    const detail = `${reason} You held ${held} of ${PLANETS.length} worlds after ${formatDuration(result.durationSeconds)}.`;

    this.setScreen(createResultScreen(headline, detail, () => this.showMenu()));
  }

  private teardownMatch(): void {
    this.detachInput?.();
    this.detachInput = null;

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

    this.hud = null;
    this.selection = { planetIndex: null, moonId: null };
    this.buildPanelDirty = true;
    this.lastPanelSignature = '';
    this.root.replaceChildren();
  }
}

/** Formats a duration in seconds as a human readable string. */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (minutes === 0) return `${remainder}s`;
  return `${minutes}m ${remainder}s`;
}
