/**
 * The 7-planet linear map.
 *
 * Source: docs/Map_Design.md — 3000 units between adjacent planets, 18,000
 * units from Home A to Home B, capitals 800 units across, neutrals 600, the
 * Center Planet 700, moons 200-300 across with 3 build slots and a 2-4 minute
 * orbital period.
 *
 * Deviations, annotated inline:
 *  - The docs give ordinal positions but no coordinates, map height or origin.
 *    A horizontal chain is laid out with a margin at each end.
 *  - Moon orbital radii are unspecified. They are placed outside the 500-unit
 *    capture radius so moons never sit inside their own planet's capture ring.
 */

import type {
  ExoticResource,
  MoonDefinition,
  PlanetDefinition,
  PlanetKind,
} from '@fleet-strike/types';

/** Distance between adjacent planets. */
export const PLANET_SPACING = 3000;

/** Empty space beyond the outermost planets. */
export const MAP_MARGIN = 1500;

/** Total playable width. */
export const WORLD_WIDTH = MAP_MARGIN * 2 + PLANET_SPACING * 6;

/** Total playable height. Vertical extent is not specified in the docs. */
export const WORLD_HEIGHT = 6000;

/** The chain runs along this y coordinate. */
export const LANE_Y = WORLD_HEIGHT / 2;

/** Home A to Home B distance, matching the documented 18,000 units. */
export const MAP_LENGTH = PLANET_SPACING * 6;

interface PlanetSpec {
  readonly id: string;
  readonly name: string;
  readonly kind: PlanetKind;
  readonly radius: number;
  readonly initialOwner: 0 | 1 | 2;
  readonly exotic: ExoticResource | null;
  readonly moonCount: number;
}

/**
 * Chain order from docs/GameLoop.md:
 * HOME A - GOLD - CRYSTAL - CENTER - GAS - TUNGSTEN - HOME B
 *
 * Note that this layout is resource-asymmetric: player 1 borders the Gold
 * Planet while player 2 borders the Tungsten Planet. The docs acknowledge this
 * and offer no compensating bonus, so it is reproduced as specified.
 */
const PLANET_SPECS: readonly PlanetSpec[] = [
  {
    id: 'home-a',
    name: 'Aurora Prime',
    kind: 'capital',
    radius: 400,
    initialOwner: 1,
    exotic: null,
    moonCount: 3,
  },
  {
    id: 'gold',
    name: 'Midas',
    kind: 'gold',
    radius: 300,
    initialOwner: 0,
    exotic: null,
    moonCount: 2,
  },
  {
    id: 'crystal',
    name: 'Lumen',
    kind: 'crystal',
    radius: 300,
    initialOwner: 0,
    exotic: 'crystal',
    moonCount: 2,
  },
  {
    id: 'center',
    name: 'The Crucible',
    kind: 'center',
    radius: 350,
    initialOwner: 0,
    exotic: null,
    moonCount: 2,
  },
  {
    id: 'gas',
    name: 'Fulmen',
    kind: 'gas',
    radius: 300,
    initialOwner: 0,
    exotic: 'gas',
    moonCount: 2,
  },
  {
    id: 'tungsten',
    name: 'Adamant',
    kind: 'tungsten',
    radius: 300,
    initialOwner: 0,
    exotic: 'tungsten',
    moonCount: 2,
  },
  {
    id: 'home-b',
    name: 'Vesper Prime',
    kind: 'capital',
    radius: 400,
    initialOwner: 2,
    exotic: null,
    moonCount: 3,
  },
];

/** Gap between a planet's surface and its innermost moon orbit. */
const MOON_ORBIT_CLEARANCE = 350;

/** Additional radius per moon so orbits do not overlap. */
const MOON_ORBIT_STEP = 130;

/** Moon radius, from the documented 200-300 unit diameter. */
const MOON_RADIUS = 120;

/** Orbital periods in seconds, cycling through the documented 2-4 minute range. */
const MOON_PERIODS = [150, 195, 240] as const;

/** Build slots per moon. */
export const MOON_BUILDING_SLOTS = 3;

function buildMoons(spec: PlanetSpec, planetIndex: number): readonly MoonDefinition[] {
  const moons: MoonDefinition[] = [];
  for (let i = 0; i < spec.moonCount; i += 1) {
    const period = MOON_PERIODS[i % MOON_PERIODS.length] ?? 180;
    moons.push({
      id: `${spec.id}-moon-${i + 1}`,
      name: `${spec.name} ${['I', 'II', 'III'][i] ?? String(i + 1)}`,
      planetIndex,
      orbitRadius: spec.radius + MOON_ORBIT_CLEARANCE + i * MOON_ORBIT_STEP,
      orbitSpeed: (Math.PI * 2) / period,
      initialAngle: (Math.PI * 2 * i) / spec.moonCount,
      radius: MOON_RADIUS,
      buildingSlots: MOON_BUILDING_SLOTS,
    });
  }
  return moons;
}

/** The complete map layout. */
export const PLANETS: readonly PlanetDefinition[] = PLANET_SPECS.map((spec, index) => ({
  index,
  id: spec.id,
  name: spec.name,
  kind: spec.kind,
  x: MAP_MARGIN + index * PLANET_SPACING,
  y: LANE_Y,
  radius: spec.radius,
  initialOwner: spec.initialOwner,
  exotic: spec.exotic,
  // Only the Gold Planet's +50% mine bonus is modelled. The docs also grant
  // Crystal/Gas/Tungsten planets +25% combat effects, which are Phase 2 scope.
  incomeBonus: spec.kind === 'gold' ? { resource: 'gold' as const, multiplier: 1.5 } : null,
  moons: buildMoons(spec, index),
}));

/** Every moon on the map, flattened. */
export const MOONS: readonly MoonDefinition[] = PLANETS.flatMap((planet) => planet.moons);

/** Chain index of each player's capital. */
export const CAPITAL_INDEX: Readonly<Record<1 | 2, number>> = { 1: 0, 2: 6 };

/** Index of the first neutral planet each player expands toward. */
export const FIRST_NEUTRAL_INDEX: Readonly<Record<1 | 2, number>> = { 1: 1, 2: 5 };

/** Looks up a planet by chain index. */
export function planetAt(index: number): PlanetDefinition | undefined {
  return PLANETS[index];
}

/** Looks up a moon by id. */
export function moonById(id: string): MoonDefinition | undefined {
  return MOONS.find((moon) => moon.id === id);
}
