/**
 * Application shell.
 *
 * Owns the screen state machine (menu -> waiting -> match -> result) and the
 * network client. The in-match scene and render loop live in `MatchView`.
 */

import type { GameEvent, PlayerId, ServerMessage } from '@fleet-strike/types';
import { PLANETS } from '@fleet-strike/config';

import { GameStore } from './game/state/store';
import { MatchView } from './match-view';
import { NetworkClient } from './network/client';
import type { ConnectionState } from './network/client';
import { createHud, showToast } from './ui/hud/hud';
import type { HudElements } from './ui/hud/hud';
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
  private view: MatchView | null = null;
  private pendingName = 'Captain';

  constructor(root: HTMLElement) {
    this.root = root;
    this.network = new NetworkClient({
      onMessage: (message: ServerMessage): void => this.handleServerMessage(message),
      onStateChange: (state: ConnectionState): void => {
        // Only surface transport failures while still on a menu screen; in a
        // match the forfeit path already explains what happened.
        if (
          (state === 'error' || state === 'closed') &&
          this.hud === null &&
          this.screen !== null
        ) {
          setMenuError(this.screen, 'Lost contact with the server. Is it running?');
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
      onCreateRoom: (name: string): void => {
        this.pendingName = name.length > 0 ? name : 'Captain';
        this.setScreen(createConnectingScreen());
        this.network.send({ type: 'CREATE_ROOM', playerName: this.pendingName });
      },
      onJoinRoom: (code: string, name: string): void => {
        this.pendingName = name.length > 0 ? name : 'Captain';
        this.setScreen(createConnectingScreen());
        this.network.send({ type: 'JOIN_ROOM', code, playerName: this.pendingName });
      },
    });

    this.setScreen(screen);
    this.network.connect();
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
        this.view?.invalidateBuildPanel();
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
        this.handleError(message.code, message.message);
        return;

      default:
        return;
    }
  }

  private handleError(code: string, text: string): void {
    if (this.hud !== null) {
      showToast(this.hud, text, true);
      return;
    }
    // A failed create or join otherwise leaves the player stuck on the
    // connecting panel, so return them to the menu with the error visible.
    if (code !== 'RATE_LIMITED') {
      this.showMenu();
    }
    if (this.screen !== null) setMenuError(this.screen, text);
  }

  private handleGameEvents(events: readonly GameEvent[]): void {
    this.view?.handleEvents(events);
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
        showToast(this.hud, mine ? `${planet.name} captured` : `${planet.name} lost`, !mine);
        this.view?.invalidateBuildPanel();
        continue;
      }
      if (event.type === 'BUILDING_COMPLETED' && event.owner === this.store.playerId) {
        this.view?.invalidateBuildPanel();
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

    const view = new MatchView(hud, this.store, {
      onSetWaypoint: (x, y): void => this.network.send({ type: 'SET_WAYPOINT', x, y }),
      onBuild: (planetIndex, moonId, buildingType): void =>
        this.network.send({ type: 'BUILD_STRUCTURE', planetIndex, moonId, buildingType }),
      onUpgrade: (buildingId): void => this.network.send({ type: 'UPGRADE_BUILDING', buildingId }),
    });

    this.view = view;
    await view.mount();
  }

  private showResult(): void {
    const result = this.store.result;
    if (result === null) return;

    const isWinner = result.winner === this.store.playerId;
    const headline = result.winner === null ? 'Stalemate' : isWinner ? 'Victory' : 'Defeat';

    const reason =
      result.reason === 'conquest'
        ? 'Total planetary conquest.'
        : result.reason === 'forfeit'
          ? 'Your rival withdrew from the battle.'
          : 'Time expired; the fleet holding more worlds prevails.';

    const held = result.planetsHeld[(this.store.playerId ?? 1) as PlayerId];
    const detail =
      `${reason} You held ${held} of ${PLANETS.length} worlds ` +
      `after ${formatDuration(result.durationSeconds)}.`;

    this.setScreen(createResultScreen(headline, detail, () => this.showMenu()));
  }

  private teardownMatch(): void {
    this.view?.destroy();
    this.view = null;
    this.hud = null;
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
