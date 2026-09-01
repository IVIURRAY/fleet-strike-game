/**
 * Build panel.
 *
 * Shows what can be constructed on the selected planet or moon, greys out
 * anything unaffordable, and lists existing structures with upgrade buttons.
 * The server re-validates everything; this only guides the player.
 */

import type { BuildingType, MoonDefinition, ResourceCost } from '@fleet-strike/types';
import {
  BUILDABLE_MOON_TYPES,
  BUILDABLE_PLANET_TYPES,
  BUILDINGS,
  PLANETS,
  discountedUpgradeCost,
  maxLevel,
  nextUpgrade,
} from '@fleet-strike/config';
import { hasResources } from '@fleet-strike/utils';

import type { GameStore } from '../../game/state/store';
import { escapeHtml } from '../screens/menu';
import type { HudElements } from './hud';

/** Which site the build panel is currently showing. */
export interface BuildSelection {
  planetIndex: number | null;
  /** `null` means the planet surface. */
  moonId: string | null;
}

/** Callbacks the build panel raises. */
export interface BuildHandlers {
  onBuild(planetIndex: number, moonId: string | null, buildingType: BuildingType): void;
  onUpgrade(buildingId: number): void;
  onSelectMoon(moonId: string | null): void;
}

/** Maps a building to a card accent class. */
function accentClass(type: BuildingType): string {
  const produces = BUILDINGS[type].produces;
  if (produces !== null) return produces;
  if (BUILDINGS[type].site === 'moon') return 'defense';
  return 'economy';
}

/** Formats a cost for display, omitting zero components. */
function formatCost(cost: ResourceCost): string {
  const parts: string[] = [];
  if (cost.gold > 0) parts.push(`${cost.gold}g`);
  if (cost.manpower > 0) parts.push(`${cost.manpower}mp`);
  if (cost.crystal > 0) parts.push(`${cost.crystal} crystal`);
  if (cost.gas > 0) parts.push(`${cost.gas} gas`);
  if (cost.tungsten > 0) parts.push(`${cost.tungsten} tungsten`);
  return parts.length > 0 ? parts.join(' · ') : 'free';
}

/** Rebuilds the build panel for the current selection. */
export function renderBuildPanel(
  hud: HudElements,
  store: GameStore,
  selection: BuildSelection,
  handlers: BuildHandlers
): void {
  const me = store.me;

  if (selection.planetIndex === null || me === null) {
    hud.buildTitle.textContent = 'Fleet command';
    hud.buildSubtitle.textContent = 'Click a planet to build · click space to set a waypoint';
    hud.moonTabs.replaceChildren();
    hud.buildScroll.innerHTML = `
      <p class="build-hint">
        Your fleet rallies to the waypoint automatically and engages anything in range.
        Capture all seven planets to win.
      </p>
    `;
    return;
  }

  const planet = PLANETS[selection.planetIndex];
  const state = store.planetAt(selection.planetIndex);
  if (planet === undefined || state === undefined) return;

  hud.buildTitle.textContent = planet.name;

  const controlled = state.owner === store.playerId;
  hud.buildSubtitle.textContent = controlled
    ? 'You control this world'
    : state.owner === 0
      ? 'Neutral - send ships to capture it'
      : 'Held by your rival';

  renderMoonTabs(hud, planet.moons, selection, handlers);

  if (!controlled) {
    hud.buildScroll.innerHTML = `
      <p class="build-hint">
        You must control ${escapeHtml(planet.name)} before building here.
        Ships within the capture radius shift ownership over time.
      </p>
    `;
    return;
  }

  const types: readonly BuildingType[] =
    selection.moonId === null ? BUILDABLE_PLANET_TYPES : BUILDABLE_MOON_TYPES;

  const grid = document.createElement('div');
  grid.className = 'card-grid';

  for (const type of types) {
    const definition = BUILDINGS[type];
    const affordable = hasResources(me.resources, definition.cost);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `card ${accentClass(type)}`;
    if (!affordable) card.setAttribute('disabled', 'true');

    const detail =
      definition.produces !== null
        ? `Builds ${definition.produces} every ${definition.productionInterval}s`
        : definition.generates !== null
          ? `+${definition.generates.amount} ${definition.generates.resource}/s`
          : definition.weapon !== null
            ? `${definition.weapon.damage} dmg · ${definition.weapon.range} range`
            : definition.repairPerSecond > 0
              ? `Repairs ${definition.repairPerSecond} hp/s`
              : definition.visionRadius > 0
                ? `Reveals ${definition.visionRadius} units`
                : definition.shieldHp > 0
                  ? `${definition.shieldHp} shield hp`
                  : `${definition.buildTime}s to build`;

    card.innerHTML = `
      <span class="card-name">${escapeHtml(definition.name)}</span>
      <span class="card-cost">${escapeHtml(formatCost(definition.cost))}</span>
      <span class="card-meta">${escapeHtml(detail)}</span>
    `;

    card.addEventListener('click', () => {
      if (selection.planetIndex === null) return;
      handlers.onBuild(selection.planetIndex, selection.moonId, type);
    });

    grid.appendChild(card);
  }

  hud.buildScroll.replaceChildren(grid);

  const existing = renderExistingBuildings(store, selection, handlers);
  if (existing !== null) hud.buildScroll.appendChild(existing);
}

/** Renders the moon selector tabs for a planet. */
function renderMoonTabs(
  hud: HudElements,
  moons: readonly MoonDefinition[],
  selection: BuildSelection,
  handlers: BuildHandlers
): void {
  hud.moonTabs.replaceChildren();

  const surface = document.createElement('button');
  surface.type = 'button';
  surface.className = selection.moonId === null ? 'rowbtn active' : 'rowbtn';
  surface.textContent = 'Surface';
  surface.addEventListener('click', () => handlers.onSelectMoon(null));
  hud.moonTabs.appendChild(surface);

  for (const moon of moons) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = selection.moonId === moon.id ? 'rowbtn active' : 'rowbtn';
    tab.textContent = moon.name;
    tab.addEventListener('click', () => handlers.onSelectMoon(moon.id));
    hud.moonTabs.appendChild(tab);
  }
}

/** Lists the structures already on this planet, with upgrade controls. */
function renderExistingBuildings(
  store: GameStore,
  selection: BuildSelection,
  handlers: BuildHandlers
): HTMLElement | null {
  if (selection.planetIndex === null) return null;

  const me = store.me;
  const buildings = store
    .buildingsOnPlanet(selection.planetIndex)
    .filter((building) => building.owner === store.playerId);

  if (buildings.length === 0 || me === null) return null;

  const list = document.createElement('div');
  list.className = 'building-list';

  for (const building of buildings) {
    const definition = BUILDINGS[building.type];
    const row = document.createElement('div');
    row.className = 'building-row';

    let status = '';
    if (building.buildProgress < 1) {
      status = `building ${Math.round(building.buildProgress * 100)}%`;
    } else if (building.isStalled) {
      status = 'stalled';
    } else if (building.productionRemaining > 0) {
      status = `next in ${Math.ceil(building.productionRemaining)}s`;
    }

    row.innerHTML = `
      <span class="name">${escapeHtml(definition.name)}</span>
      <span class="lvl">L${building.level}</span>
      <span class="status ${building.isStalled ? 'stalled' : ''}">${escapeHtml(status)}</span>
    `;

    const upgrade = nextUpgrade(building.type, building.level);
    if (upgrade !== null && building.buildProgress >= 1) {
      const price = discountedUpgradeCost(upgrade.cost, 0);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-btn';
      button.textContent = `L${upgrade.level} · ${formatCost(price)}`;
      if (!hasResources(me.resources, price)) button.setAttribute('disabled', 'true');
      button.addEventListener('click', () => handlers.onUpgrade(building.id));
      row.appendChild(button);
    } else if (building.level >= maxLevel(building.type)) {
      const maxed = document.createElement('span');
      maxed.className = 'status';
      maxed.textContent = 'max';
      row.appendChild(maxed);
    }

    list.appendChild(row);
  }

  return list;
}
