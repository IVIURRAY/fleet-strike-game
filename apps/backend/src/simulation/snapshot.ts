/**
 * World serialisation.
 *
 * Converts the ECS Structure-of-Arrays world into the plain objects the network
 * protocol carries. Numeric ids are used for ship and weapon types so payloads
 * stay compact.
 *
 * Positions are rounded to whole units and rotations to three decimals. At the
 * documented map scale a sub-unit position is invisible, and rounding
 * meaningfully shrinks both the JSON payload and the delta diff.
 */

import { hasComponent } from 'bitecs';
import type {
  BuildingState,
  MatchPhase,
  MoonState,
  PlanetState,
  PlayerId,
  PlayerView,
  ProjectileSnapshot,
  ShipSnapshot,
  WorldSnapshot,
} from '@fleet-strike/types';
import { BUILDING_TYPES } from '@fleet-strike/types';
import { PLANETS, buildingMaxHp } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import {
  BuildingClass,
  Capturable,
  Health,
  Owner,
  PlanetRef,
  Position,
  Production,
  Projectile,
  Rotation,
  ShipClass,
  UnderConstruction,
  buildingQuery,
  orbitalQuery,
  planetQuery,
  projectileQuery,
  shipQuery,
} from '@fleet-strike/ecs';

/** Rounds to whole units. */
function round(value: number): number {
  return Math.round(value);
}

/** Rounds a rotation to three decimal places. */
function roundAngle(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Serialises every live ship. */
export function serializeShips(world: GameWorld): ShipSnapshot[] {
  const entities = shipQuery(world);
  const ships: ShipSnapshot[] = new Array(entities.length);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    ships[i] = {
      id: eid,
      type: ShipClass.typeId[eid] as number,
      owner: Owner.playerId[eid] as PlayerId,
      x: round(Position.x[eid] as number),
      y: round(Position.y[eid] as number),
      rotation: roundAngle(Rotation.angle[eid] as number),
      hp: round(Health.current[eid] as number),
      maxHp: round(Health.max[eid] as number),
    };
  }

  return ships;
}

/** Serialises every in-flight projectile. */
export function serializeProjectiles(world: GameWorld): ProjectileSnapshot[] {
  const entities = projectileQuery(world);
  const projectiles: ProjectileSnapshot[] = new Array(entities.length);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    projectiles[i] = {
      id: eid,
      weapon: Projectile.weaponId[eid] as number,
      owner: Owner.playerId[eid] as PlayerId,
      x: round(Position.x[eid] as number),
      y: round(Position.y[eid] as number),
      rotation: roundAngle(Rotation.angle[eid] as number),
    };
  }

  return projectiles;
}

/** Serialises planet ownership and capture state. */
export function serializePlanets(world: GameWorld): PlanetState[] {
  const entities = planetQuery(world);
  const planets: PlanetState[] = [];

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const index = PlanetRef.index[eid] as number;

    planets.push({
      index,
      owner: Owner.playerId[eid] as 0 | 1 | 2,
      captureProgress: Math.round(Capturable.progress[eid] as number),
      presence: {
        1: Capturable.presenceP1[eid] as number,
        2: Capturable.presenceP2[eid] as number,
      },
    });
  }

  planets.sort((a, b) => a.index - b.index);
  return planets;
}

/**
 * Serialises moon positions and ownership.
 *
 * Moon entities are created in map order, so counting how many of a planet's
 * moons have already been seen yields the definition index and therefore a
 * stable id across the session.
 */
export function serializeMoons(world: GameWorld): MoonState[] {
  const entities = orbitalQuery(world);
  const moons: MoonState[] = [];
  const seenPerPlanet = new Map<number, number>();

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const planetIndex = PlanetRef.index[eid] as number;
    const planet = PLANETS[planetIndex];
    if (planet === undefined) continue;

    const localIndex = seenPerPlanet.get(planetIndex) ?? 0;
    seenPerPlanet.set(planetIndex, localIndex + 1);

    const definition = planet.moons[localIndex];
    if (definition === undefined) continue;

    moons.push({
      id: definition.id,
      x: round(Position.x[eid] as number),
      y: round(Position.y[eid] as number),
      owner: Owner.playerId[eid] as 0 | 1 | 2,
    });
  }

  return moons;
}

/** Serialises every building, including construction and production progress. */
export function serializeBuildings(world: GameWorld): BuildingState[] {
  const entities = buildingQuery(world);
  const buildings: BuildingState[] = [];

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const type = BUILDING_TYPES[BuildingClass.typeId[eid] as number];
    if (type === undefined) continue;

    const level = BuildingClass.level[eid] as number;
    const isBuilding = hasComponent(world, UnderConstruction, eid);
    const total = isBuilding ? (UnderConstruction.total[eid] as number) : 0;
    const remaining = isBuilding ? (UnderConstruction.remaining[eid] as number) : 0;

    buildings.push({
      id: eid,
      type,
      owner: Owner.playerId[eid] as PlayerId,
      planetIndex: PlanetRef.index[eid] as number,
      x: round(Position.x[eid] as number),
      y: round(Position.y[eid] as number),
      level,
      hp: round(Health.current[eid] as number),
      maxHp: buildingMaxHp(type, level),
      buildProgress: total > 0 ? Math.round((1 - remaining / total) * 100) / 100 : 1,
      productionRemaining: hasComponent(world, Production, eid)
        ? Math.round((Production.remaining[eid] as number) * 10) / 10
        : 0,
      isStalled: hasComponent(world, Production, eid)
        ? (Production.stalled[eid] as number) === 1
        : false,
    });
  }

  return buildings;
}

/** Serialises the public view of every player. */
export function serializePlayers(world: GameWorld): PlayerView[] {
  const views: PlayerView[] = [];

  for (const [playerId, player] of world.context.players) {
    views.push({
      id: playerId,
      name: player.name,
      status: player.status,
      resources: {
        gold: Math.floor(player.resources.gold),
        manpower: Math.floor(player.resources.manpower),
        crystal: Math.floor(player.resources.crystal),
        gas: Math.floor(player.resources.gas),
        tungsten: Math.floor(player.resources.tungsten),
      },
      income: {
        gold: Math.round(player.income.gold * 10) / 10,
        manpower: Math.round(player.income.manpower * 10) / 10,
        crystal: Math.round(player.income.crystal * 10) / 10,
        gas: Math.round(player.income.gas * 10) / 10,
        tungsten: Math.round(player.income.tungsten * 10) / 10,
      },
      caps: player.caps,
      waypoint: { x: round(player.waypoint.x), y: round(player.waypoint.y) },
      controlledPlanets: [...player.controlledPlanets],
      shipCount: countShips(world, playerId),
    });
  }

  views.sort((a, b) => a.id - b.id);
  return views;
}

function countShips(world: GameWorld, playerId: PlayerId): number {
  const entities = shipQuery(world);
  let count = 0;
  for (let i = 0; i < entities.length; i += 1) {
    if ((Owner.playerId[entities[i] as number] as number) === playerId) count += 1;
  }
  return count;
}

/** Builds a complete, self-contained snapshot of the world. */
export function serializeWorld(world: GameWorld): WorldSnapshot {
  const { context } = world;
  return {
    tick: context.tick,
    elapsed: Math.round(context.elapsed * 10) / 10,
    phase: context.phase as MatchPhase,
    players: serializePlayers(world),
    planets: serializePlanets(world),
    moons: serializeMoons(world),
    buildings: serializeBuildings(world),
    ships: serializeShips(world),
    projectiles: serializeProjectiles(world),
    result: context.result,
  };
}
