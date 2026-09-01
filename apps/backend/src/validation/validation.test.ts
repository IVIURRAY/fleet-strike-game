import { beforeEach, describe, expect, it } from 'vitest';

import { PLANETS } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import {
  BuildingClass,
  Owner,
  PlanetRef,
  createBuilding,
  createMatch,
  findPlanetEntity,
  orbitalQuery,
  slotPosition,
} from '@fleet-strike/ecs';

import { hasSparePower, validateBuild, validateUpgrade, validateWaypoint } from './index';

function newWorld(): GameWorld {
  const world = createMatch({
    players: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ],
  });
  world.context.phase = 'playing';
  return world;
}

/** Resolves a moon entity the same way the room does. */
function findMoonEntity(world: GameWorld, moonId: string): number {
  const moons = orbitalQuery(world);
  const seen = new Map<number, number>();
  for (let i = 0; i < moons.length; i += 1) {
    const eid = moons[i] as number;
    const planetIndex = PlanetRef.index[eid] as number;
    const planet = PLANETS[planetIndex];
    if (planet === undefined) continue;
    const local = seen.get(planetIndex) ?? 0;
    seen.set(planetIndex, local + 1);
    if (planet.moons[local]?.id === moonId) return eid;
  }
  return 0;
}

function buildParams(world: GameWorld, overrides: Record<string, unknown> = {}) {
  return {
    world,
    playerId: 1 as const,
    planetIndex: 0,
    moonId: null,
    buildingType: 'scoutFactory',
    resolvePlanetEntity: (index: number) => findPlanetEntity(world, index),
    resolveMoonEntity: (moonId: string) => findMoonEntity(world, moonId),
    allocatePosition: () => ({ x: 100, y: 100 }),
    ...overrides,
  };
}

describe('validateWaypoint', () => {
  it('accepts a position inside the map', () => {
    const result = validateWaypoint(5000, 3000);
    expect(result.ok).toBe(true);
  });

  it('rejects non-numeric input', () => {
    expect(validateWaypoint('5000', 3000).ok).toBe(false);
    expect(validateWaypoint(null, 3000).ok).toBe(false);
    expect(validateWaypoint(undefined, undefined).ok).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(validateWaypoint(Number.NaN, 0).ok).toBe(false);
    expect(validateWaypoint(Number.POSITIVE_INFINITY, 0).ok).toBe(false);
  });

  it('rejects positions outside the map', () => {
    expect(validateWaypoint(-1, 3000).ok).toBe(false);
    expect(validateWaypoint(1e9, 3000).ok).toBe(false);
  });
});

describe('validateBuild', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newWorld();
  });

  it('accepts a legal factory on a controlled planet', () => {
    const result = validateBuild(buildParams(world));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.type).toBe('scoutFactory');
      expect(result.value.cost.gold).toBe(50);
    }
  });

  it('rejects an unknown building type', () => {
    const result = validateBuild(buildParams(world, { buildingType: 'deathStar' }));
    expect(result.ok).toBe(false);
  });

  it('rejects a non-string building type', () => {
    expect(validateBuild(buildParams(world, { buildingType: 42 })).ok).toBe(false);
  });

  it('refuses to build a second Command Center', () => {
    const result = validateBuild(buildParams(world, { buildingType: 'commandCenter' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Command Center/i);
  });

  it('rejects a planet the player does not control', () => {
    // Planet 6 is player 2's capital.
    const result = validateBuild(buildParams(world, { planetIndex: 6 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/do not control/i);
  });

  it('rejects a neutral planet', () => {
    const result = validateBuild(buildParams(world, { planetIndex: 3 }));
    expect(result.ok).toBe(false);
  });

  it('rejects an out-of-range planet index', () => {
    expect(validateBuild(buildParams(world, { planetIndex: 99 })).ok).toBe(false);
    expect(validateBuild(buildParams(world, { planetIndex: -1 })).ok).toBe(false);
    expect(validateBuild(buildParams(world, { planetIndex: 1.5 })).ok).toBe(false);
  });

  it('rejects a moon building placed on a planet surface', () => {
    const result = validateBuild(
      buildParams(world, { buildingType: 'plasmaTurret', moonId: null })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/must be built on a moon/i);
  });

  it('rejects a planet building placed on a moon', () => {
    const moonId = PLANETS[0]!.moons[0]!.id;
    const result = validateBuild(buildParams(world, { buildingType: 'goldMine', moonId }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/planet surface/i);
  });

  it('accepts a turret on a controlled moon', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 1000;
    player.resources.gas = 100;

    const moonId = PLANETS[0]!.moons[0]!.id;
    const result = validateBuild(buildParams(world, { buildingType: 'plasmaTurret', moonId }));
    expect(result.ok).toBe(true);
  });

  it('rejects a moon that does not orbit the given planet', () => {
    const foreignMoon = PLANETS[3]!.moons[0]!.id;
    const result = validateBuild(
      buildParams(world, { buildingType: 'plasmaTurret', moonId: foreignMoon, planetIndex: 0 })
    );
    expect(result.ok).toBe(false);
  });

  it('enforces the three slot limit on moons', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 10000;
    player.resources.gas = 1000;

    const planet = PLANETS[0]!;
    const moon = planet.moons[0]!;
    const moonEntity = findMoonEntity(world, moon.id);

    for (let i = 0; i < moon.buildingSlots; i += 1) {
      createBuilding(world, {
        type: 'flakBattery',
        owner: 1,
        x: 0,
        y: 0,
        planetIndex: 0,
        parentEntity: moonEntity,
        instant: true,
      });
    }

    const result = validateBuild(
      buildParams(world, { buildingType: 'plasmaTurret', moonId: moon.id })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/no free building slots/i);
  });

  it('rejects a build the player cannot afford', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 0;

    const result = validateBuild(buildParams(world));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not enough gold/i);
  });

  it('rejects a build lacking exotic resources', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 10000;
    player.resources.crystal = 0;

    const result = validateBuild(buildParams(world, { buildingType: 'medicBay' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/crystal/i);
  });

  it('applies the gold planet income bonus to mines built there', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 10000;
    Owner.playerId[findPlanetEntity(world, 1)] = 1;

    const result = validateBuild(buildParams(world, { buildingType: 'goldMine', planetIndex: 1 }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.incomeMultiplier).toBe(1.5);
  });

  it('does not apply the gold bonus to non-gold buildings', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 10000;
    Owner.playerId[findPlanetEntity(world, 1)] = 1;

    const result = validateBuild(
      buildParams(world, { buildingType: 'manpowerCenter', planetIndex: 1 })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.incomeMultiplier).toBe(1);
  });

  it('blocks a build that would exceed the planet power budget', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 100000;

    const planet = PLANETS[0]!;
    const planetEntity = findPlanetEntity(world, 0);

    // Heavy Factories draw 5 power against a base budget of 10.
    for (let i = 0; i < 2; i += 1) {
      createBuilding(world, {
        type: 'heavyFactory',
        owner: 1,
        ...slotPosition(planet.x, planet.y, planet.radius, 10 + i),
        planetIndex: 0,
        parentEntity: planetEntity,
        instant: true,
      });
    }

    const result = validateBuild(buildParams(world, { buildingType: 'scoutFactory' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/power/i);
  });

  it('allows more buildings once a Power Plant is up', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 100000;

    const planet = PLANETS[0]!;
    const planetEntity = findPlanetEntity(world, 0);

    for (let i = 0; i < 2; i += 1) {
      createBuilding(world, {
        type: 'heavyFactory',
        owner: 1,
        ...slotPosition(planet.x, planet.y, planet.radius, 10 + i),
        planetIndex: 0,
        parentEntity: planetEntity,
        instant: true,
      });
    }
    expect(validateBuild(buildParams(world)).ok).toBe(false);

    createBuilding(world, {
      type: 'powerPlant',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 20),
      planetIndex: 0,
      parentEntity: planetEntity,
      instant: true,
    });

    expect(validateBuild(buildParams(world)).ok).toBe(true);
  });
});

describe('hasSparePower', () => {
  it('always allows a zero-power building', () => {
    const world = newWorld();
    expect(hasSparePower(world, 0, 1, 0)).toBe(true);
  });

  it('respects the base planet power budget', () => {
    const world = newWorld();
    expect(hasSparePower(world, 0, 1, 10)).toBe(true);
    expect(hasSparePower(world, 0, 1, 11)).toBe(false);
  });
});

describe('validateUpgrade', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newWorld();
  });

  function addMine(): number {
    const planet = PLANETS[0]!;
    return createBuilding(world, {
      type: 'goldMine',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 3),
      planetIndex: 0,
      parentEntity: findPlanetEntity(world, 0),
      instant: true,
    });
  }

  it('accepts an affordable upgrade', () => {
    world.context.players.get(1)!.resources.gold = 1000;
    const mine = addMine();

    const result = validateUpgrade(world, 1, mine);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.newLevel).toBe(2);
      expect(result.value.cost.gold).toBe(100);
    }
  });

  it('rejects an unowned building', () => {
    world.context.players.get(2)!.resources.gold = 1000;
    const mine = addMine();

    const result = validateUpgrade(world, 2, mine);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/do not own/i);
  });

  it('rejects a non-existent building', () => {
    expect(validateUpgrade(world, 1, 99999).ok).toBe(false);
  });

  it('rejects malformed ids', () => {
    expect(validateUpgrade(world, 1, -1).ok).toBe(false);
    expect(validateUpgrade(world, 1, 1.5).ok).toBe(false);
    expect(validateUpgrade(world, 1, 'abc').ok).toBe(false);
  });

  it('rejects an unaffordable upgrade', () => {
    world.context.players.get(1)!.resources.gold = 0;
    const mine = addMine();
    expect(validateUpgrade(world, 1, mine).ok).toBe(false);
  });

  it('rejects a building still under construction', () => {
    world.context.players.get(1)!.resources.gold = 1000;
    const planet = PLANETS[0]!;
    const mine = createBuilding(world, {
      type: 'goldMine',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 9),
      planetIndex: 0,
      parentEntity: findPlanetEntity(world, 0),
    });

    const result = validateUpgrade(world, 1, mine);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/under construction/i);
  });

  it('rejects an already maxed building', () => {
    world.context.players.get(1)!.resources.gold = 100000;
    const mine = addMine();
    BuildingClass.level[mine] = 4;

    const result = validateUpgrade(world, 1, mine);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/fully upgraded/i);
  });

  it('applies the research lab discount', () => {
    const player = world.context.players.get(1)!;
    player.resources.gold = 100000;
    player.upgradeDiscount = 0.4;

    const mine = addMine();
    const result = validateUpgrade(world, 1, mine);
    expect(result.ok).toBe(true);
    // 100 gold at a 40% discount.
    if (result.ok) expect(result.value.cost.gold).toBe(60);
  });
});
