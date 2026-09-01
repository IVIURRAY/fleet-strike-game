/**
 * The in-game HUD shell.
 *
 * Layout follows docs/UI_Design_System.md: a top bar with per-player status and
 * a central timer, the PixiJS arena in the middle, and a bottom bar holding the
 * resource wallet and the build panel.
 */

import { escapeHtml } from '../screens/menu';

/** Handles to the HUD nodes the game loop updates each frame. */
export interface HudElements {
  readonly root: HTMLElement;
  readonly arena: HTMLElement;
  readonly overlay: HTMLElement;
  readonly roomChip: HTMLElement;
  readonly perfChip: HTMLElement;
  readonly toastStack: HTMLElement;
  readonly minimap: HTMLCanvasElement;
  readonly timer: HTMLElement;
  readonly phaseLabel: HTMLElement;
  readonly myName: HTMLElement;
  readonly myPips: HTMLElement;
  readonly myFleet: HTMLElement;
  readonly theirName: HTMLElement;
  readonly theirPips: HTMLElement;
  readonly theirFleet: HTMLElement;
  readonly wallet: HTMLElement;
  readonly buildTitle: HTMLElement;
  readonly buildSubtitle: HTMLElement;
  readonly moonTabs: HTMLElement;
  readonly buildScroll: HTMLElement;
}

/** Builds the HUD DOM and returns handles to its dynamic parts. */
export function createHud(roomCode: string): HudElements {
  const root = document.createElement('div');
  root.className = 'shell';
  root.innerHTML = `
    <header class="topbar">
      <div class="topbar-side">
        <span class="brand">Fleet Strike</span>
        <div class="player-block">
          <span class="player-name me" id="my-name">You</span>
          <div class="planet-pips" id="my-pips"></div>
          <span class="label-small" id="my-fleet">0 ships</span>
        </div>
      </div>

      <div class="topbar-center">
        <span class="stat-large timer" id="timer">00:00</span>
        <span class="label-small phase-label" id="phase-label">Setup</span>
      </div>

      <div class="topbar-side enemy">
        <div class="player-block">
          <span class="player-name them" id="their-name">Rival</span>
          <div class="planet-pips" id="their-pips"></div>
          <span class="label-small" id="their-fleet" style="text-align:right">0 ships</span>
        </div>
      </div>
    </header>

    <main class="arena" id="arena">
      <div class="arena-overlay" id="overlay">
        <div class="room-chip" id="room-chip">ROOM: ${escapeHtml(roomCode)}</div>
        <canvas class="minimap clickable" id="minimap" width="560" height="160"></canvas>
        <div class="perf-chip" id="perf-chip"></div>
        <div class="toast-stack" id="toast-stack"></div>
      </div>
    </main>

    <footer class="bottom">
      <section class="wallet" id="wallet"></section>
      <section class="build-area">
        <div class="build-header">
          <span class="build-title" id="build-title">Fleet command</span>
          <span class="label-small" id="build-subtitle">Click a planet to build</span>
        </div>
        <div class="build-scroll">
          <div class="moon-tabs" id="moon-tabs"></div>
          <div id="build-scroll"></div>
        </div>
      </section>
    </footer>
  `;

  const query = <T extends HTMLElement>(id: string): T => {
    const element = root.querySelector<T>(`#${id}`);
    if (element === null) throw new Error(`HUD element #${id} is missing`);
    return element;
  };

  return {
    root,
    arena: query('arena'),
    overlay: query('overlay'),
    roomChip: query('room-chip'),
    perfChip: query('perf-chip'),
    toastStack: query('toast-stack'),
    minimap: query<HTMLCanvasElement>('minimap'),
    timer: query('timer'),
    phaseLabel: query('phase-label'),
    myName: query('my-name'),
    myPips: query('my-pips'),
    myFleet: query('my-fleet'),
    theirName: query('their-name'),
    theirPips: query('their-pips'),
    theirFleet: query('their-fleet'),
    wallet: query('wallet'),
    buildTitle: query('build-title'),
    buildSubtitle: query('build-subtitle'),
    moonTabs: query('moon-tabs'),
    buildScroll: query('build-scroll'),
  };
}

/** Shows a transient message. Errors are styled differently from notices. */
export function showToast(hud: HudElements, message: string, isError = false): void {
  const toast = document.createElement('div');
  toast.className = isError ? 'toast error' : 'toast';
  toast.textContent = message;
  hud.toastStack.appendChild(toast);

  // Cap the stack so a burst of rejections cannot fill the screen.
  while (hud.toastStack.childElementCount > 4) {
    hud.toastStack.firstElementChild?.remove();
  }

  setTimeout(() => toast.remove(), 3200);
}
