/**
 * Menu and lobby screens.
 *
 * Rendered as modal panels over the canvas, matching docs/UI_Design_System.md
 * which lists the main menu and victory screen as `.panel` use cases.
 */

import { isValidRoomCode, normalizeRoomCode } from '@fleet-strike/utils';

/** Callbacks the menu raises. */
export interface MenuHandlers {
  onCreateRoom(playerName: string): void;
  onJoinRoom(code: string, playerName: string): void;
}

/** Creates the main menu panel. */
export function createMenuScreen(handlers: MenuHandlers): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'panel-backdrop';
  backdrop.innerHTML = `
    <div class="panel fade-in">
      <h1 class="brand">Fleet Strike</h1>
      <p class="tagline">
        Build your galactic empire. Seize all seven worlds. Crush anyone who stands in your way.
      </p>

      <div class="panel-section">
        <label class="label-small" for="player-name">Captain name</label>
        <input class="input" id="player-name" maxlength="24" placeholder="Captain" />
      </div>

      <div class="panel-section">
        <button class="btn btn-primary" id="create-room" type="button">Create room</button>
      </div>

      <div class="panel-section">
        <label class="label-small" for="room-code">Join with a code</label>
        <div class="panel-row">
          <input class="input" id="room-code" maxlength="6" placeholder="ABC123" />
          <button class="btn btn-secondary" id="join-room" type="button">Join</button>
        </div>
        <p class="error-text" id="menu-error"></p>
      </div>
    </div>
  `;

  const nameInput = backdrop.querySelector<HTMLInputElement>('#player-name');
  const codeInput = backdrop.querySelector<HTMLInputElement>('#room-code');
  const errorText = backdrop.querySelector<HTMLElement>('#menu-error');

  const playerName = (): string => nameInput?.value.trim() ?? '';

  const showError = (message: string): void => {
    if (errorText !== null) errorText.textContent = message;
  };

  backdrop.querySelector('#create-room')?.addEventListener('click', () => {
    showError('');
    handlers.onCreateRoom(playerName());
  });

  const attemptJoin = (): void => {
    const code = normalizeRoomCode(codeInput?.value ?? '');
    if (!isValidRoomCode(code)) {
      showError('Room codes are 6 characters, letters and digits only.');
      return;
    }
    showError('');
    handlers.onJoinRoom(code, playerName());
  };

  backdrop.querySelector('#join-room')?.addEventListener('click', attemptJoin);

  codeInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') attemptJoin();
  });

  // Uppercase as the player types so the field always matches the real code.
  codeInput?.addEventListener('input', () => {
    if (codeInput !== null) codeInput.value = codeInput.value.toUpperCase();
  });

  return backdrop;
}

/** Sets an error message on an already-mounted menu screen. */
export function setMenuError(screen: HTMLElement, message: string): void {
  const errorText = screen.querySelector<HTMLElement>('#menu-error');
  if (errorText !== null) errorText.textContent = message;
}

/** Creates the "waiting for an opponent" panel. */
export function createWaitingScreen(code: string, onCancel: () => void): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'panel-backdrop';
  backdrop.innerHTML = `
    <div class="panel fade-in">
      <h1 class="glow-cyan">Awaiting rival captain</h1>
      <p class="tagline">Share this code so they can join your battle.</p>
      <div class="panel-section">
        <div class="stat-large glow-magenta" id="waiting-code">${escapeHtml(code)}</div>
      </div>
      <button class="btn btn-secondary" id="cancel-wait" type="button">Cancel</button>
    </div>
  `;
  backdrop.querySelector('#cancel-wait')?.addEventListener('click', onCancel);
  return backdrop;
}

/** Creates the victory or defeat panel. */
export function createResultScreen(
  headline: string,
  detail: string,
  onRematch: () => void
): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'panel-backdrop';
  backdrop.innerHTML = `
    <div class="panel fade-in">
      <h1 id="result-headline">${escapeHtml(headline)}</h1>
      <p class="tagline" id="result-detail">${escapeHtml(detail)}</p>
      <button class="btn btn-primary" id="rematch" type="button">Back to menu</button>
    </div>
  `;
  backdrop.querySelector('#rematch')?.addEventListener('click', onRematch);
  return backdrop;
}

/** Creates a full-screen connecting notice. */
export function createConnectingScreen(): HTMLElement {
  const backdrop = document.createElement('div');
  backdrop.className = 'panel-backdrop';
  backdrop.innerHTML = `
    <div class="panel fade-in">
      <h1 class="glow-cyan">Connecting</h1>
      <p class="tagline">Establishing a link to the fleet command server.</p>
    </div>
  `;
  return backdrop;
}

/** Escapes text before interpolating it into markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
