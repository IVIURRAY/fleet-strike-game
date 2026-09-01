/**
 * Per-frame HUD updates: timer, player status, resource wallet.
 */

import { EXOTIC_RESOURCES } from '@fleet-strike/types';
import { MATCH_TIME_LIMIT, PLANETS, SETUP_DURATION } from '@fleet-strike/config';

import type { GameStore } from '../../game/state/store';
import type { HudElements } from './hud';

/** Formats seconds as mm:ss. */
export function formatClock(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  const remainder = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

/** Updates the top bar and the resource wallet. */
export function updateHud(hud: HudElements, store: GameStore): void {
  updateTopBar(hud, store);
  updateWallet(hud, store);
}

function updateTopBar(hud: HudElements, store: GameStore): void {
  if (store.phase === 'setup') {
    hud.timer.textContent = formatClock(Math.max(0, SETUP_DURATION - store.elapsed));
    hud.phaseLabel.textContent = 'Deploying';
  } else {
    // Count down toward the match time limit so the pressure is legible.
    hud.timer.textContent = formatClock(Math.max(0, MATCH_TIME_LIMIT - store.elapsed));
    hud.phaseLabel.textContent = store.phase === 'finished' ? 'Concluded' : 'Engaged';
  }

  const me = store.me;
  const them = store.opponent;

  if (me !== null) {
    hud.myName.textContent = me.name;
    hud.myFleet.textContent = `${me.shipCount} ships`;
  }
  if (them !== null) {
    hud.theirName.textContent = them.name;
    hud.theirFleet.textContent = `${them.shipCount} ships`;
  }

  renderPips(hud.myPips, store, store.playerId, 'mine');
  renderPips(hud.theirPips, store, them?.id ?? null, 'theirs');
}

/** Draws one pip per planet, lit for those the given player holds. */
function renderPips(
  container: HTMLElement,
  store: GameStore,
  playerId: number | null,
  className: string
): void {
  // Rebuild only when the count changes; retinting is cheap.
  if (container.childElementCount !== PLANETS.length) {
    container.replaceChildren();
    for (let i = 0; i < PLANETS.length; i += 1) {
      const pip = document.createElement('span');
      pip.className = 'pip';
      container.appendChild(pip);
    }
  }

  for (let i = 0; i < PLANETS.length; i += 1) {
    const pip = container.children[i] as HTMLElement | undefined;
    if (pip === undefined) continue;
    const owned = playerId !== null && store.planetAt(i)?.owner === playerId;
    pip.className = owned ? `pip ${className}` : 'pip';
  }
}

/** Resource rows, in display order. */
const WALLET_ROWS = [
  { key: 'gold', label: 'Gold', className: 'gold' },
  { key: 'manpower', label: 'Manpower', className: '' },
  { key: 'crystal', label: 'Crystal', className: '' },
  { key: 'gas', label: 'Gas', className: '' },
  { key: 'tungsten', label: 'Tungsten', className: '' },
] as const;

function updateWallet(hud: HudElements, store: GameStore): void {
  const me = store.me;
  if (me === null) return;

  if (hud.wallet.childElementCount !== WALLET_ROWS.length) {
    hud.wallet.replaceChildren();
    for (const row of WALLET_ROWS) {
      const element = document.createElement('div');
      element.className = 'resource-row';
      element.dataset['key'] = row.key;
      element.innerHTML = `
        <span class="label-small">${row.label}</span>
        <span>
          <span class="resource-value ${row.className}"></span>
          <span class="resource-rate"></span>
        </span>
      `;
      hud.wallet.appendChild(element);
    }
  }

  for (const row of WALLET_ROWS) {
    const element = hud.wallet.querySelector<HTMLElement>(`[data-key="${row.key}"]`);
    if (element === null) continue;

    const value = element.querySelector<HTMLElement>('.resource-value');
    const rate = element.querySelector<HTMLElement>('.resource-rate');
    const amount = me.resources[row.key];
    const income = me.income[row.key];

    // Exotics stay greyed out until the matching planet is captured.
    const isExotic = (EXOTIC_RESOURCES as readonly string[]).includes(row.key);
    const isLocked = isExotic && amount === 0 && income === 0;
    element.classList.toggle('locked', isLocked);

    if (value !== null) {
      value.textContent =
        row.key === 'manpower'
          ? `${amount}/${me.caps.manpower}`
          : String(amount);
    }

    if (rate !== null) {
      if (isLocked) {
        rate.textContent = 'locked';
        rate.classList.remove('income');
      } else {
        rate.textContent = income > 0 ? `+${income}/s` : '';
        rate.classList.toggle('income', income > 0);
      }
    }
  }
}
