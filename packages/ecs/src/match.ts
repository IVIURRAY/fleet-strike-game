/**
 * Match initialisation.
 *
 * Builds the complete starting world: the 7-planet chain, its 16 moons, each
 * player's Command Center, and the documented starting fleet of 5 Scouts and
 * 3 Soldiers.
 *
 * Starting conditions come from docs/GameLoop.md: 165 gold, 50 manpower,
 * 5 gold/second, and a waypoint pre-set to the nearest neutral planet.
 */

import type { PlayerId, ShipType } from '@fleet-strike/types';
import { emptyPlayerStats } from '@fleet-strike/types';
import {
  CAPITAL_INDEX,
  FIRST_NEUTRAL_INDEX,
  MANPOWER_BASE_CAP,
  PLANETS,
  SETUP_DURATION,
  STARTING_FLEET,
  STARTING_GOLD,
  STARTING_MANPOWER,
  STARTS_WITH_GOLD_MINE,
  STARTS_WITH_MANPOWER_CENTER,
} from '@fleet-strike/config';
import { makeCaps } from '@fleet-strike/utils';

import { PlanetRef } from './components';
import { planetQuery } from './queries';
import { createBuilding } from './entities/building';
import { createMoon, createPlanet } from './entities/planet';
import { createShip } from './entities/ship';
import { recalculateIncome, updatePlanetControl } from './systems';
import { spatialIndexSystem } from './systems/spatial-index';
import { createGameWorld } from './world';
import type { GameWorld } from './world';

/** A player joining a match. */
export interface MatchPlayerSpec {
  readonly id: PlayerId;
  readonly name: string;
}

/** Options for creating a match world. */
export interface CreateMatchParams {
  readonly players: readonly MatchPlayerSpec[];
  /** Seed for the deterministic random source. */
  readonly seed?: number;
}

/** Builds a fully initialised match world ready to tick. */
export function createMatch(params: CreateMatchParams): GameWorld {
  const world = createGameWorld(params.seed ?? 1);

  for (const spec of params.players) {
    addPlayer(world, spec);
  }

  buildMap(world);

  for (const spec of params.players) {
    buildStartingBase(world, spec.id);
    spawnStartingFleet(world, spec.id);
  }

  // Prime the cached planet list and derived player state before the first tick.
  spatialIndexSystem(world);
  updatePlanetControl(world);
  recalculateIncome(world);

  world.context.phase = 'setup';
  world.context.setupRemaining = SETUP_DURATION;

  return world;
}

/** Registers a player with their documented starting resources. */
function addPlayer(world: GameWorld, spec: MatchPlayerSpec): void {
  const waypointIndex = FIRST_NEUTRAL_INDEX[spec.id];
  const waypointPlanet = PLANETS[waypointIndex];

  world.context.players.set(spec.id, {
    id: spec.id,
    name: spec.name,
    status: 'connected',
    resources: {
      gold: STARTING_GOLD,
      manpower: STARTING_MANPOWER,
      crystal: 0,
      gas: 0,
      tungsten: 0,
    },
    income: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
    caps: makeCaps(MANPOWER_BASE_CAP),
    waypoint: { x: waypointPlanet?.x ?? 0, y: waypointPlanet?.y ?? 0 },
    controlledPlanets: [],
    upgradeDiscount: 0,
    productionSpeedBonus: 0,
    stats: emptyPlayerStats(),
  });
}

/** Creates every planet and moon entity. */
function buildMap(world: GameWorld): void {
  for (const planet of PLANETS) {
    const planetEntity = createPlanet(world, planet);
    for (const moon of planet.moons) {
      createMoon(world, moon, planetEntity, planet);
    }
  }
}

/** Places a player's starting structures on their capital. */
function buildStartingBase(world: GameWorld, playerId: PlayerId): void {
  const index = CAPITAL_INDEX[playerId];
  const planet = PLANETS[index];
  if (planet === undefined) return;

  const planetEntity = findPlanetEntity(world, index);
  if (planetEntity === 0) return;

  createBuilding(world, {
    type: 'commandCenter',
    owner: playerId,
    ...slotPosition(planet.x, planet.y, planet.radius, 0),
    planetIndex: index,
    parentEntity: planetEntity,
    instant: true,
  });

  // Both flags default to false: four separate doc statements say the first
  // Gold Mine and Manpower Center must be built, against one that says they
  // are pre-placed. See STARTS_WITH_GOLD_MINE in the config package.
  if (STARTS_WITH_GOLD_MINE) {
    createBuilding(world, {
      type: 'goldMine',
      owner: playerId,
      ...slotPosition(planet.x, planet.y, planet.radius, 1),
      planetIndex: index,
      parentEntity: planetEntity,
      instant: true,
    });
  }

  if (STARTS_WITH_MANPOWER_CENTER) {
    createBuilding(world, {
      type: 'manpowerCenter',
      owner: playerId,
      ...slotPosition(planet.x, planet.y, planet.radius, 2),
      planetIndex: index,
      parentEntity: planetEntity,
      instant: true,
    });
  }
}

/** Spawns the documented 5 Scouts and 3 Soldiers. */
function spawnStartingFleet(world: GameWorld, playerId: PlayerId): void {
  const index = CAPITAL_INDEX[playerId];
  const planet = PLANETS[index];
  const player = world.context.players.get(playerId);
  if (planet === undefined || player === undefined) return;

  let slot = 0;
  for (const group of STARTING_FLEET) {
    for (let i = 0; i < group.count; i += 1) {
      const angle = (Math.PI * 2 * slot) / 8;
      const radius = planet.radius + 220;
      createShip(world, {
        type: group.type as ShipType,
        owner: playerId,
        x: planet.x + Math.cos(angle) * radius,
        y: planet.y + Math.sin(angle) * radius,
        rotation: angle,
        waypointX: player.waypoint.x,
        waypointY: player.waypoint.y,
      });
      slot += 1;
    }
  }
}

/** Distributes buildings evenly around a planet's surface. */
export function slotPosition(
  planetX: number,
  planetY: number,
  planetRadius: number,
  slot: number
): { x: number; y: number } {
  // 12 positions per ring, then step outward. Planets have unlimited slots in
  // the MVP, so rings grow indefinitely.
  const perRing = 12;
  const ring = Math.floor(slot / perRing);
  const indexInRing = slot % perRing;
  const angle = (Math.PI * 2 * indexInRing) / perRing + ring * 0.26;
  const radius = planetRadius * 0.62 + ring * 46;
  return { x: planetX + Math.cos(angle) * radius, y: planetY + Math.sin(angle) * radius };
}

/** Finds the entity id of a planet by its chain index. */
export function findPlanetEntity(world: GameWorld, index: number): number {
  for (const entity of world.context.planetEntities) {
    if (PlanetRef.index[entity] === index) return entity;
  }
  // The cache is only populated once the spatial index has run, so fall back to
  // a direct query during initialisation.
  const planets = planetQuery(world);
  for (let i = 0; i < planets.length; i += 1) {
    const entity = planets[i] as number;
    if (PlanetRef.index[entity] === index) return entity;
  }
  return 0;
}
