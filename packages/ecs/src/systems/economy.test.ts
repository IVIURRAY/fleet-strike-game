import { beforeEach, describe, expect, it } from 'vitest';

import {
  COMMAND_CENTER_GOLD_PER_SECOND,
  EXOTIC_CAP,
  EXOTIC_PER_SECOND,
  MANPOWER_BASE_CAP,
  PLANETS,
  SHIPS,
  STARTING_GOLD,
  STARTING_MANPOWER,
} from '@fleet-strike/config';

import { BuildingClass, Owner, Production, UnderConstruction } from '../components';
import { BUILDING_TYPES } from '@fleet-strike/types';
import { createMatch, findPlanetEntity, slotPosition } from '../match';
import { createBuilding } from '../entities/building';
import { createShip } from '../entities/ship';
import { constructionSystem, productionSystem } from './production';
import { economySystem, recalculateIncome } from './economy';
import { spatialIndexSystem } from './spatial-index';
import { captureSystem, updatePlanetControl } from './capture';
import { buildingQuery, shipQuery } from '../queries';
import type { GameWorld } from '../world';

function newMatch(): GameWorld {
  const world = createMatch({
    players: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ],
  });
  world.context.phase = 'playing';
  return world;
}

describe('starting conditions', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newMatch();
  });

  it('gives both players a command center even in the first match of a process', () => {
    // Regression: entity id 0 doubles as the "no entity" sentinel, so the very
    // first match created in a process used to skip player 1's Command Center
    // because findPlanetEntity(0) returned a real entity that read as "missing".
    // createGameWorld now reserves id 0.
    const buildings = buildingQuery(world);
    const commandCenters = Array.from(buildings).filter(
      (eid) => BUILDING_TYPES[BuildingClass.typeId[eid] as number] === 'commandCenter'
    );
    expect(commandCenters).toHaveLength(2);

    const owners = commandCenters.map((eid) => Owner.playerId[eid]).sort();
    expect(owners).toEqual([1, 2]);
  });

  it('gives each player the documented starting resources', () => {
    for (const player of world.context.players.values()) {
      expect(player.resources.gold).toBe(STARTING_GOLD);
      expect(player.resources.manpower).toBe(STARTING_MANPOWER);
      expect(player.resources.crystal).toBe(0);
      expect(player.caps.manpower).toBe(MANPOWER_BASE_CAP);
    }
  });

  it('starts each player at 5 gold per second and no manpower income', () => {
    for (const player of world.context.players.values()) {
      expect(player.income.gold).toBe(COMMAND_CENTER_GOLD_PER_SECOND);
      expect(player.income.manpower).toBe(0);
    }
  });

  it('spawns the documented 5 scouts and 3 soldiers per player', () => {
    const ships = shipQuery(world);
    // 8 ships each for two players.
    expect(ships).toHaveLength(16);
  });

  it('points each waypoint at the nearest neutral planet', () => {
    expect(world.context.players.get(1)?.waypoint.x).toBe(PLANETS[1]?.x);
    expect(world.context.players.get(2)?.waypoint.x).toBe(PLANETS[5]?.x);
  });
});

describe('economySystem', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newMatch();
  });

  it('accrues gold continuously', () => {
    const player = world.context.players.get(1)!;
    const before = player.resources.gold;

    economySystem(world, 10);

    expect(player.resources.gold).toBeCloseTo(before + 5 * 10, 4);
  });

  it('adds gold mine income once construction completes', () => {
    const player = world.context.players.get(1)!;
    const planetEntity = findPlanetEntity(world, 0);
    const planet = PLANETS[0]!;

    createBuilding(world, {
      type: 'goldMine',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 5),
      planetIndex: 0,
      parentEntity: planetEntity,
    });

    // Still under construction, so income is unchanged.
    recalculateIncome(world);
    expect(player.income.gold).toBe(5);

    constructionSystem(world, 40);
    recalculateIncome(world);
    expect(player.income.gold).toBe(8);
  });

  it('applies the gold planet bonus', () => {
    const player = world.context.players.get(1)!;
    const goldPlanet = PLANETS[1]!;
    const planetEntity = findPlanetEntity(world, 1);

    // Give player 1 the Gold Planet.
    Owner.playerId[planetEntity] = 1;
    createBuilding(world, {
      type: 'goldMine',
      owner: 1,
      ...slotPosition(goldPlanet.x, goldPlanet.y, goldPlanet.radius, 0),
      planetIndex: 1,
      parentEntity: planetEntity,
      incomeMultiplier: goldPlanet.incomeBonus?.multiplier ?? 1,
      instant: true,
    });

    spatialIndexSystem(world);
    updatePlanetControl(world);
    recalculateIncome(world);

    // 5 base + 3 * 1.5 = 9.5
    expect(player.income.gold).toBeCloseTo(9.5, 4);
  });

  it('grants exotic resources from planet control alone', () => {
    const player = world.context.players.get(1)!;
    const crystalPlanet = findPlanetEntity(world, 2);
    Owner.playerId[crystalPlanet] = 1;

    spatialIndexSystem(world);
    updatePlanetControl(world);
    recalculateIncome(world);

    expect(player.income.crystal).toBe(EXOTIC_PER_SECOND);

    economySystem(world, 10);
    expect(player.resources.crystal).toBeCloseTo(EXOTIC_PER_SECOND * 10, 4);
  });

  it('caps exotic resources', () => {
    const player = world.context.players.get(1)!;
    Owner.playerId[findPlanetEntity(world, 2)] = 1;

    spatialIndexSystem(world);
    updatePlanetControl(world);

    economySystem(world, 10000);
    expect(player.resources.crystal).toBe(EXOTIC_CAP);
  });

  it('leaves gold uncapped', () => {
    const player = world.context.players.get(1)!;
    economySystem(world, 100000);
    expect(player.resources.gold).toBeGreaterThan(100000);
  });

  it('raises the manpower cap with manpower centers', () => {
    const player = world.context.players.get(1)!;
    const planet = PLANETS[0]!;
    const planetEntity = findPlanetEntity(world, 0);

    createBuilding(world, {
      type: 'manpowerCenter',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 6),
      planetIndex: 0,
      parentEntity: planetEntity,
      instant: true,
    });

    recalculateIncome(world);

    expect(player.income.manpower).toBe(2);
    expect(player.caps.manpower).toBe(MANPOWER_BASE_CAP + 50);
  });

  it('loses command center income when the capital is captured', () => {
    const player = world.context.players.get(1)!;
    expect(player.income.gold).toBe(COMMAND_CENTER_GOLD_PER_SECOND);

    const planet = PLANETS[0]!;
    // Overwhelm the capital so the capture system transfers the planet and,
    // with it, the Command Center that generates the income.
    for (let i = 0; i < 30; i += 1) {
      createShip(world, {
        type: 'scout',
        owner: 2,
        x: planet.x + (i % 10) * 4,
        y: planet.y + Math.floor(i / 10) * 4,
        waypointX: planet.x,
        waypointY: planet.y,
      });
    }

    for (let i = 0; i < 100; i += 1) {
      spatialIndexSystem(world);
      captureSystem(world, 1);
    }

    expect(Owner.playerId[findPlanetEntity(world, 0)]).toBe(2);

    updatePlanetControl(world);
    recalculateIncome(world);

    expect(player.income.gold).toBe(0);
    expect(world.context.players.get(2)?.income.gold).toBe(COMMAND_CENTER_GOLD_PER_SECOND * 2);
  });
});

describe('productionSystem', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newMatch();
  });

  it('spawns a unit every 45 seconds', () => {
    addFactory(world, 1);
    const before = shipQuery(world).length;

    // Not yet due.
    productionSystem(world, 44);
    expect(shipQuery(world).length).toBe(before);

    productionSystem(world, 2);
    expect(shipQuery(world).length).toBe(before + 1);
  });

  it('does not produce while under construction', () => {
    const planet = PLANETS[0]!;
    const planetEntity = findPlanetEntity(world, 0);
    createBuilding(world, {
      type: 'scoutFactory',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 7),
      planetIndex: 0,
      parentEntity: planetEntity,
    });

    const before = shipQuery(world).length;
    productionSystem(world, 100);
    expect(shipQuery(world).length).toBe(before);
  });

  it('charges gold and manpower for each unit', () => {
    const player = world.context.players.get(1)!;
    addFactory(world, 1);

    const goldBefore = player.resources.gold;
    const manpowerBefore = player.resources.manpower;

    productionSystem(world, 46);

    expect(player.resources.gold).toBe(goldBefore - SHIPS.scout.cost.gold);
    expect(player.resources.manpower).toBe(manpowerBefore - SHIPS.scout.cost.manpower);
    expect(player.stats.shipsProduced).toBe(1);
  });

  it('stalls instead of producing when resources run out', () => {
    const player = world.context.players.get(1)!;
    const factory = addFactory(world, 1);
    player.resources.gold = 0;
    player.resources.manpower = 0;

    const before = shipQuery(world).length;
    productionSystem(world, 46);

    expect(shipQuery(world).length).toBe(before);
    expect(Production.stalled[factory]).toBe(1);

    // Once funded, the stalled factory produces on the next tick.
    player.resources.gold = 100;
    player.resources.manpower = 10;
    productionSystem(world, 1);
    expect(shipQuery(world).length).toBe(before + 1);
    expect(Production.stalled[factory]).toBe(0);
  });

  it('produces faster after an upgrade', () => {
    const factory = addFactory(world, 1);
    BuildingClass.level[factory] = 3;

    const before = shipQuery(world).length;
    productionSystem(world, 46);
    expect(shipQuery(world).length).toBe(before + 1);

    // Level 3 Scout Factories cycle every 30 seconds.
    expect(Production.interval[factory] as number).toBeCloseTo(30, 4);
  });

  it('halts production on a planet lost to the enemy', () => {
    const factory = addFactory(world, 1);
    Production.active[factory] = 0;

    const before = shipQuery(world).length;
    productionSystem(world, 100);
    expect(shipQuery(world).length).toBe(before);
  });

  it('emits a completion event when construction finishes', () => {
    const planet = PLANETS[0]!;
    const planetEntity = findPlanetEntity(world, 0);
    createBuilding(world, {
      type: 'goldMine',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 8),
      planetIndex: 0,
      parentEntity: planetEntity,
    });

    world.context.events.length = 0;
    constructionSystem(world, 40);

    const completed = world.context.events.filter((e) => e.type === 'BUILDING_COMPLETED');
    expect(completed).toHaveLength(1);
  });
});

function addFactory(world: GameWorld, owner: 1 | 2): number {
  const index = owner === 1 ? 0 : 6;
  const planet = PLANETS[index]!;
  const planetEntity = findPlanetEntity(world, index);
  const entity = createBuilding(world, {
    type: 'scoutFactory',
    owner,
    ...slotPosition(planet.x, planet.y, planet.radius, 4),
    planetIndex: index,
    parentEntity: planetEntity,
    instant: true,
  });
  expect(UnderConstruction.remaining[entity] ?? 0).toBe(0);
  return entity;
}
