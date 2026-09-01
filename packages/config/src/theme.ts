/**
 * Rendering palette shared by the canvas and the CSS layer.
 *
 * Source: docs/UI_Design_System.md. Hex values are reproduced exactly; the
 * duplicate greens in that document are collapsed onto the tokenised values.
 */

/** Neon palette as PixiJS hex numbers. */
export const COLORS = {
  cyan: 0x4fcbe9,
  cyanBright: 0x67ddf7,
  cyanGlow: 0x32bcdc,
  magenta: 0xc65cff,
  magentaBright: 0xcc5cff,
  magentaGlow: 0x9b4dff,
  green: 0x8eff63,
  greenBright: 0x62ff42,
  greenGlow: 0x52ff44,
  gold: 0xfff06a,
  goldBright: 0xffad32,
  pink: 0xff4fff,
  purple: 0x684cff,
  spaceBackground: 0x010108,
  neutral: 0x8899aa,
} as const;

/** Team colours. Player 1 is cyan, player 2 is magenta. */
export const TEAM_COLORS: Readonly<Record<1 | 2, number>> = {
  1: COLORS.cyan,
  2: COLORS.magenta,
};

/** Planet fill colour by ownership, including the neutral state. */
export const OWNER_COLORS: Readonly<Record<0 | 1 | 2, number>> = {
  0: COLORS.neutral,
  1: COLORS.cyan,
  2: COLORS.magenta,
};

/** Z-order layers for the PixiJS scene graph, lowest drawn first. */
export const LAYERS = {
  background: 0,
  lanes: 10,
  planets: 20,
  moons: 30,
  buildings: 40,
  captureRings: 50,
  ships: 60,
  projectiles: 70,
  effects: 80,
  overlays: 90,
} as const;

/** Ships are drawn this many times larger than their hitbox radius. */
export const SHIP_RENDER_SCALE = 2.4;

/** Default camera zoom, chosen to frame roughly one planet plus its lane. */
export const DEFAULT_ZOOM = 0.35;

/** Camera zoom bounds. */
export const MIN_ZOOM = 0.06;
export const MAX_ZOOM = 2.5;

/** Multiplier applied per mouse wheel notch. */
export const ZOOM_STEP = 1.15;
