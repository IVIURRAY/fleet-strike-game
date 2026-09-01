import { readFileSync } from 'node:fs';

import { beforeEach, describe, expect, it } from 'vitest';

import type { BuildingState, PlanetState, PlayerView } from '@fleet-strike/types';
import { BUILDINGS, PLANETS, WORLD_HEIGHT, WORLD_WIDTH } from '@fleet-strike/config';

import { GameStore } from '../../game/state/store';
import { renderBuildPanel } from './build-panel';
import type { BuildSelection } from './build-panel';
import { createHud, showToast } from './hud';
import type { HudElements } from './hud';
import { drawMinimap, minimapToWorld } from './minimap';
import { updateHud } from './update-hud';

// Vitest runs with apps/frontend as its root.
const HUD_CSS = readFileSync('src/styles/hud.css', 'utf8');

function playerView(overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    id: 1,
    name: 'Ada',
    status: 'connected',
    resources: { gold: 5000, manpower: 50, crystal: 0, gas: 0, tungsten: 0 },
    income: { gold: 5, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
    caps: { manpower: 200, crystal: 500, gas: 500, tungsten: 500 },
    waypoint: { x: 4500, y: 3000 },
    controlledPlanets: [0],
    shipCount: 8,
    ...overrides,
  };
}

function planet(index: number, owner: 0 | 1 | 2): PlanetState {
  return { index, owner, captureProgress: 0, presence: { 1: 0, 2: 0 } };
}

function building(overrides: Partial<BuildingState> = {}): BuildingState {
  return {
    id: 100,
    type: 'goldMine',
    owner: 1,
    planetIndex: 0,
    x: 0,
    y: 0,
    level: 1,
    hp: 350,
    maxHp: 350,
    buildProgress: 1,
    productionRemaining: 0,
    isStalled: false,
    ...overrides,
  };
}

function storeWith(overrides: {
  players?: PlayerView[];
  planets?: PlanetState[];
  buildings?: BuildingState[];
}): GameStore {
  const store = new GameStore();
  store.playerId = 1;
  store.phase = 'playing';
  store.players = overrides.players ?? [playerView()];
  store.planets = overrides.planets ?? PLANETS.map((p) => planet(p.index, p.index === 0 ? 1 : 0));
  store.buildings = overrides.buildings ?? [];
  return store;
}

describe('createHud', () => {
  let hud: HudElements;

  beforeEach(() => {
    hud = createHud('ABCDEF');
  });

  it('builds every element the render loop needs', () => {
    expect(hud.root.classList.contains('shell')).toBe(true);
    expect(hud.arena).toBeTruthy();
    expect(hud.timer).toBeTruthy();
    expect(hud.wallet).toBeTruthy();
    expect(hud.minimap.tagName).toBe('CANVAS');
  });

  it('shows the room code', () => {
    expect(hud.roomChip.textContent).toContain('ABCDEF');
  });

  it('escapes the room code rather than injecting markup', () => {
    const injected = createHud('<img src=x>');
    expect(injected.roomChip.querySelector('img')).toBeNull();
    expect(injected.roomChip.textContent).toContain('<img src=x>');
  });
});

describe('showToast', () => {
  it('appends a toast', () => {
    const hud = createHud('ABCDEF');
    showToast(hud, 'Planet captured');
    expect(hud.toastStack.childElementCount).toBe(1);
    expect(hud.toastStack.textContent).toContain('Planet captured');
  });

  it('marks errors', () => {
    const hud = createHud('ABCDEF');
    showToast(hud, 'Not enough gold', true);
    expect(hud.toastStack.firstElementChild?.classList.contains('error')).toBe(true);
  });

  it('caps the stack so a burst cannot fill the screen', () => {
    const hud = createHud('ABCDEF');
    for (let i = 0; i < 20; i += 1) showToast(hud, `msg ${i}`);
    expect(hud.toastStack.childElementCount).toBeLessThanOrEqual(4);
  });

  it('renders messages as text, not markup', () => {
    const hud = createHud('ABCDEF');
    showToast(hud, '<b>bold</b>');
    expect(hud.toastStack.querySelector('b')).toBeNull();
  });
});

describe('updateHud', () => {
  it('shows a countdown and the player names', () => {
    const hud = createHud('ABCDEF');
    const store = storeWith({
      players: [playerView(), playerView({ id: 2, name: 'Grace', controlledPlanets: [6] })],
    });
    store.elapsed = 65;

    updateHud(hud, store);

    expect(hud.myName.textContent).toBe('Ada');
    expect(hud.theirName.textContent).toBe('Grace');
    expect(hud.myFleet.textContent).toContain('8');
    expect(hud.timer.textContent).toMatch(/^\d\d:\d\d$/);
  });

  it('renders one pip per planet and lights the ones held', () => {
    const hud = createHud('ABCDEF');
    const store = storeWith({});
    updateHud(hud, store);

    expect(hud.myPips.childElementCount).toBe(PLANETS.length);
    const lit = Array.from(hud.myPips.children).filter((pip) => pip.classList.contains('mine'));
    expect(lit).toHaveLength(1);
  });

  it('lists every resource and greys out locked exotics', () => {
    const hud = createHud('ABCDEF');
    updateHud(hud, storeWith({}));

    const rows = hud.wallet.querySelectorAll('.resource-row');
    expect(rows).toHaveLength(5);

    const crystal = hud.wallet.querySelector('[data-key="crystal"]');
    expect(crystal?.classList.contains('locked')).toBe(true);
    expect(crystal?.querySelector('.resource-rate')?.textContent).toBe('locked');
  });

  it('unlocks an exotic once it produces', () => {
    const hud = createHud('ABCDEF');
    const store = storeWith({
      players: [
        playerView({
          income: { gold: 5, manpower: 0, crystal: 5, gas: 0, tungsten: 0 },
        }),
      ],
    });

    updateHud(hud, store);

    const crystal = hud.wallet.querySelector('[data-key="crystal"]');
    expect(crystal?.classList.contains('locked')).toBe(false);
    expect(crystal?.querySelector('.resource-rate')?.textContent).toBe('+5/s');
  });

  it('shows manpower against its cap', () => {
    const hud = createHud('ABCDEF');
    updateHud(hud, storeWith({}));
    const manpower = hud.wallet.querySelector('[data-key="manpower"] .resource-value');
    expect(manpower?.textContent).toBe('50/200');
  });
});

describe('renderBuildPanel', () => {
  let hud: HudElements;
  const noopHandlers = {
    onBuild: (): void => {},
    onUpgrade: (): void => {},
    onSelectMoon: (): void => {},
  };

  beforeEach(() => {
    hud = createHud('ABCDEF');
  });

  it('prompts the player when nothing is selected', () => {
    const selection: BuildSelection = { planetIndex: null, moonId: null };
    renderBuildPanel(hud, storeWith({}), selection, noopHandlers);

    expect(hud.buildTitle.textContent).toBe('Fleet command');
    expect(hud.buildScroll.textContent).toMatch(/waypoint/i);
  });

  it('offers planet buildings on a controlled planet', () => {
    const selection: BuildSelection = { planetIndex: 0, moonId: null };
    renderBuildPanel(hud, storeWith({}), selection, noopHandlers);

    expect(hud.buildTitle.textContent).toBe(PLANETS[0]!.name);
    const cards = hud.buildScroll.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThan(0);
    expect(hud.buildScroll.textContent).toContain(BUILDINGS.goldMine.name);
    // Moon-only defences must not be offered on a planet surface.
    expect(hud.buildScroll.textContent).not.toContain(BUILDINGS.plasmaTurret.name);
  });

  it('offers moon defences when a moon is selected', () => {
    const moonId = PLANETS[0]!.moons[0]!.id;
    const selection: BuildSelection = { planetIndex: 0, moonId };
    renderBuildPanel(hud, storeWith({}), selection, noopHandlers);

    expect(hud.buildScroll.textContent).toContain(BUILDINGS.plasmaTurret.name);
    expect(hud.buildScroll.textContent).not.toContain(BUILDINGS.goldMine.name);
  });

  it('refuses to offer anything on a planet the player does not control', () => {
    const selection: BuildSelection = { planetIndex: 3, moonId: null };
    renderBuildPanel(hud, storeWith({}), selection, noopHandlers);

    expect(hud.buildScroll.querySelectorAll('.card')).toHaveLength(0);
    expect(hud.buildScroll.textContent).toMatch(/must control/i);
  });

  it('disables cards the player cannot afford', () => {
    const store = storeWith({
      players: [
        playerView({ resources: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 } }),
      ],
    });
    renderBuildPanel(hud, store, { planetIndex: 0, moonId: null }, noopHandlers);

    const cards = hud.buildScroll.querySelectorAll('.card');
    const disabled = hud.buildScroll.querySelectorAll('.card[disabled]');
    expect(cards.length).toBeGreaterThan(0);
    expect(disabled.length).toBe(cards.length);
  });

  it('fires onBuild with the selected site', () => {
    let captured: unknown[] = [];
    renderBuildPanel(
      hud,
      storeWith({}),
      { planetIndex: 0, moonId: null },
      {
        ...noopHandlers,
        onBuild: (planetIndex, moonId, buildingType): void => {
          captured = [planetIndex, moonId, buildingType];
        },
      }
    );

    const card = hud.buildScroll.querySelector<HTMLButtonElement>('.card:not([disabled])');
    card?.click();

    expect(captured[0]).toBe(0);
    expect(captured[1]).toBeNull();
    expect(typeof captured[2]).toBe('string');
  });

  it('renders a surface tab plus one per moon', () => {
    renderBuildPanel(hud, storeWith({}), { planetIndex: 0, moonId: null }, noopHandlers);
    const tabs = hud.moonTabs.querySelectorAll('.rowbtn');
    expect(tabs).toHaveLength(1 + PLANETS[0]!.moons.length);
    expect(tabs[0]?.classList.contains('active')).toBe(true);
  });

  it('lists existing buildings with an upgrade button', () => {
    const store = storeWith({ buildings: [building()] });
    renderBuildPanel(hud, store, { planetIndex: 0, moonId: null }, noopHandlers);

    const rows = hud.buildScroll.querySelectorAll('.building-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain('L1');
    expect(rows[0]?.querySelector('.upgrade-btn')).not.toBeNull();
  });

  it('marks a fully upgraded building as max', () => {
    const store = storeWith({ buildings: [building({ level: 4 })] });
    renderBuildPanel(hud, store, { planetIndex: 0, moonId: null }, noopHandlers);

    const row = hud.buildScroll.querySelector('.building-row');
    expect(row?.textContent).toContain('max');
    expect(row?.querySelector('.upgrade-btn')).toBeNull();
  });

  it('shows construction progress and stalls', () => {
    const store = storeWith({
      buildings: [building({ buildProgress: 0.5 }), building({ id: 101, isStalled: true })],
    });
    renderBuildPanel(hud, store, { planetIndex: 0, moonId: null }, noopHandlers);

    expect(hud.buildScroll.textContent).toContain('50%');
    expect(hud.buildScroll.textContent).toContain('stalled');
  });

  it('hides the opponent buildings', () => {
    const store = storeWith({ buildings: [building({ owner: 2 })] });
    renderBuildPanel(hud, store, { planetIndex: 0, moonId: null }, noopHandlers);
    expect(hud.buildScroll.querySelectorAll('.building-row')).toHaveLength(0);
  });
});

/**
 * jsdom has no canvas implementation, so a recording stub stands in for the 2D
 * context. It also lets the test assert what was actually drawn.
 */
function stubContext(canvas: HTMLCanvasElement): { calls: string[] } {
  const calls: string[] = [];
  const record =
    (name: string) =>
    (...args: unknown[]): void => {
      calls.push(`${name}(${args.join(',')})`);
    };

  const context = {
    clearRect: record('clearRect'),
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    arc: record('arc'),
    fill: record('fill'),
    stroke: record('stroke'),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  };

  // The stub only implements the handful of 2D calls the minimap uses.
  canvas.getContext = (() => context) as unknown as HTMLCanvasElement['getContext'];
  return { calls };
}

describe('minimap', () => {
  const camera = {
    getViewport: () => ({ x: 0, y: 0, width: 4000, height: 3000 }),
  };

  it('draws the planets, lanes, fleet and viewport', () => {
    const hud = createHud('ABCDEF');
    const recorder = stubContext(hud.minimap);

    const store = storeWith({});
    store.applySnapshot({
      tick: 0,
      elapsed: 0,
      phase: 'playing',
      players: [playerView()],
      planets: PLANETS.map((p) => planet(p.index, p.index === 0 ? 1 : 0)),
      moons: [],
      buildings: [],
      ships: [{ id: 1, type: 0, owner: 1, x: 1500, y: 3000, rotation: 0, hp: 80, maxHp: 80 }],
      projectiles: [],
      result: null,
    });
    store.playerId = 1;

    drawMinimap(hud.minimap, store, camera as never);

    // One arc per planet, a rect for the ship, and a stroked viewport box.
    expect(recorder.calls.filter((c) => c.startsWith('arc'))).toHaveLength(PLANETS.length);
    expect(recorder.calls.some((c) => c.startsWith('fillRect'))).toBe(true);
    expect(recorder.calls.some((c) => c.startsWith('strokeRect'))).toBe(true);
    expect(recorder.calls[0]).toMatch(/^clearRect/);
  });

  it('is a no-op when no 2D context is available', () => {
    const hud = createHud('ABCDEF');
    hud.minimap.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
    expect(() => drawMinimap(hud.minimap, storeWith({}), camera as never)).not.toThrow();
  });

  it('maps a click at the centre to the middle of the world', () => {
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;

    const world = minimapToWorld(canvas, 50, 25);
    expect(world.x).toBeGreaterThan(0);
    expect(world.y).toBeGreaterThan(0);
  });

  it('maps the top left corner to the world origin', () => {
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;

    const world = minimapToWorld(canvas, 0, 0);
    expect(world.x).toBe(0);
    expect(world.y).toBe(0);
  });
});

describe('arena canvas layering', () => {
  // These assert the stylesheet text rather than computed styles on purpose.
  // jsdom's getComputedStyle does not implement CSS specificity - it applies the
  // last matching rule in source order - so it reports `.minimap`'s own width
  // even when a higher-specificity `.arena canvas` rule would beat it in a real
  // browser. A cascade test here would pass while the page stayed broken, so the
  // selector shape is guarded directly.
  const css = HUD_CSS;

  it('scopes the render surface rule to .arena direct children', () => {
    expect(css).toContain('.arena > canvas');
  });

  it('never uses a bare .arena canvas descendant selector', () => {
    // The minimap is also a <canvas> inside .arena (nested in .arena-overlay).
    // `.arena canvas` is specificity 0,1,1 and outranks `.minimap` at 0,1,0, so
    // it stretched the minimap over the whole arena and hid the game behind it.
    // It also defeated `.minimap { display: none }` in the <=1024px breakpoint.
    expect(css).not.toMatch(/\.arena\s+canvas\s*\{/);
  });

  it('does not force width or height onto the render surface', () => {
    // PixiJS owns sizing via resizeTo + autoDensity, which it writes inline.
    const rule = /\.arena > canvas \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).not.toMatch(/\bwidth\s*:/);
    expect(rule).not.toMatch(/\bheight\s*:/);
  });

  it('keeps the minimap sized by its own rule', () => {
    const rule = /\.minimap \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(rule).toMatch(/width:\s*280px/);
    expect(rule).toMatch(/height:\s*80px/);
  });
});

describe('minimap aspect ratio', () => {
  const worldAspect = WORLD_WIDTH / WORLD_HEIGHT;

  it('matches the world aspect in its backing buffer', () => {
    // drawMinimap derives scaleX and scaleY independently, so a mismatch here
    // silently squashes the map and makes planets elliptical.
    const hud = createHud('ABCDEF');
    expect(hud.minimap.width / hud.minimap.height).toBeCloseTo(worldAspect, 5);
  });

  it('matches the world aspect in its CSS box', () => {
    const rule = /\.minimap \{([^}]*)\}/.exec(HUD_CSS)?.[1] ?? '';
    const width = Number(/width:\s*(\d+)px/.exec(rule)?.[1]);
    const height = Number(/height:\s*(\d+)px/.exec(rule)?.[1]);
    expect(width / height).toBeCloseTo(worldAspect, 5);
  });

  it('supersamples 2x so the minimap stays crisp on retina', () => {
    const hud = createHud('ABCDEF');
    expect(hud.minimap.width).toBe(280 * 2);
    expect(hud.minimap.height).toBe(80 * 2);
  });
});
