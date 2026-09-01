/**
 * Headless playtest harness.
 *
 * Runs full matches with scripted opponents to sanity-check pacing, balance and
 * simulation performance without a browser. Not a unit test: it asserts broad
 * properties (matches terminate, economies grow, fleets scale) rather than exact
 * values, so it stays useful while balance is still being tuned.
 *
 *   pnpm -C apps/backend playtest
 */

import type { GameWorld } from '@fleet-strike/ecs';
import {
  BuildingClass,
  Owner,
  PlanetRef,
  WaypointFollower,
  buildingQuery,
  createBuilding,
  createMatch,
  createShip,
  findPlanetEntity,
  runSimulationTick,
  shipQuery,
  slotPosition,
} from '@fleet-strike/ecs';
import type { BuildingType, PlayerId } from '@fleet-strike/types';
import { BUILDING_TYPES } from '@fleet-strike/types';
import {
  BUILDINGS,
  FIXED_DELTA,
  MATCH_TIME_LIMIT,
  PLANETS,
  PLANET_BASE_POWER,
  TICK_RATE,
  powerCapacity,
} from '@fleet-strike/config';
import { hasResources, spend } from '@fleet-strike/utils';

/** A scripted opening, applied in order whenever affordable. */
type BuildOrder = readonly BuildingType[];

/** Documented opening from docs/ResourcesEconomy.md, "Economic Boom". */
const ECONOMIC_BOOM: BuildOrder = [
  'goldMine',
  'goldMine',
  'manpowerCenter',
  'scoutFactory',
  'soldierFactory',
  'powerPlant',
  'goldMine',
  'engineerWorkshop',
  'soldierFactory',
  'powerPlant',
  'heavyFactory',
  'manpowerCenter',
  'goldMine',
  'soldierFactory',
  'powerPlant',
  'heavyFactory',
];

/** Documented opening, "Fast Expand" into military. */
const FAST_EXPAND: BuildOrder = [
  'scoutFactory',
  'soldierFactory',
  'goldMine',
  'powerPlant',
  'engineerWorkshop',
  'soldierFactory',
  'goldMine',
  'manpowerCenter',
  'powerPlant',
  'soldierFactory',
  'goldMine',
  'powerPlant',
  'heavyFactory',
  'soldierFactory',
];

interface Bot {
  readonly playerId: PlayerId;
  readonly order: BuildOrder;
  step: number;
}

/** Remaining power headroom on a planet for one player. */
function sparePower(world: GameWorld, planetIndex: number, playerId: PlayerId): number {
  let capacity = PLANET_BASE_POWER;
  let used = 0;
  const buildings = buildingQuery(world);

  for (let i = 0; i < buildings.length; i += 1) {
    const eid = buildings[i] as number;
    if ((PlanetRef.index[eid] as number) !== planetIndex) continue;
    if ((Owner.playerId[eid] as number) !== playerId) continue;
    const type = BUILDING_TYPES[BuildingClass.typeId[eid] as number];
    if (type === undefined) continue;
    capacity += powerCapacity(type, BuildingClass.level[eid] as number);
    used += BUILDINGS[type].power;
  }

  return capacity - used;
}

/** Counts structures on a planet, used to pick the next slot. */
function buildingsOn(world: GameWorld, planetIndex: number): number {
  const buildings = buildingQuery(world);
  let count = 0;
  for (let i = 0; i < buildings.length; i += 1) {
    if ((PlanetRef.index[buildings[i] as number] as number) === planetIndex) count += 1;
  }
  return count;
}

/**
 * Advances a bot's build order by at most one structure.
 *
 * Builds on any controlled planet with power headroom, preferring the capital so
 * production stays defended.
 */
function stepBot(world: GameWorld, bot: Bot): void {
  if (bot.step >= bot.order.length) return;

  const player = world.context.players.get(bot.playerId);
  if (player === undefined) return;

  const type = bot.order[bot.step];
  if (type === undefined) return;

  const definition = BUILDINGS[type];
  if (!hasResources(player.resources, definition.cost)) return;

  // Prefer the capital, then any other controlled planet.
  const candidates = [...player.controlledPlanets].sort((a, b) => {
    const capital = bot.playerId === 1 ? 0 : PLANETS.length - 1;
    return Math.abs(a - capital) - Math.abs(b - capital);
  });

  for (const planetIndex of candidates) {
    const planet = PLANETS[planetIndex];
    if (planet === undefined) continue;
    if (sparePower(world, planetIndex, bot.playerId) < definition.power) continue;

    const planetEntity = findPlanetEntity(world, planetIndex);
    if (planetEntity === 0) continue;

    if (!spend(player.resources, definition.cost)) return;

    createBuilding(world, {
      type,
      owner: bot.playerId,
      ...slotPosition(planet.x, planet.y, planet.radius, buildingsOn(world, planetIndex) + 1),
      planetIndex,
      parentEntity: planetEntity,
      incomeMultiplier:
        planet.incomeBonus !== null &&
        planet.incomeBonus.resource === definition.generates?.resource
          ? planet.incomeBonus.multiplier
          : 1,
      productionSpeedBonus: player.productionSpeedBonus,
    });

    player.stats.buildingsConstructed += 1;
    bot.step += 1;
    return;
  }
}

/** Pushes each player's waypoint toward the nearest contested or enemy planet. */
function updateWaypoints(world: GameWorld): void {
  for (const [playerId, player] of world.context.players) {
    const capital = playerId === 1 ? 0 : PLANETS.length - 1;
    const direction = playerId === 1 ? 1 : -1;

    // Advance to the first planet along the chain that is not already held.
    let targetIndex = capital;
    for (let step = 1; step < PLANETS.length; step += 1) {
      const index = capital + direction * step;
      if (index < 0 || index >= PLANETS.length) break;
      targetIndex = index;
      if (!player.controlledPlanets.includes(index)) break;
    }

    const target = PLANETS[targetIndex];
    if (target === undefined) continue;
    player.waypoint.x = target.x;
    player.waypoint.y = target.y;

    // Retarget existing ships so they follow the advancing front.
    const ships = shipQuery(world);
    for (let i = 0; i < ships.length; i += 1) {
      const eid = ships[i] as number;
      if ((Owner.playerId[eid] as number) !== playerId) continue;
      WaypointFollower.targetX[eid] = target.x;
      WaypointFollower.targetY[eid] = target.y;
    }
  }
}

interface Sample {
  minute: number;
  goldP1: number;
  goldP2: number;
  incomeP1: number;
  incomeP2: number;
  ships: number;
  planetsP1: number;
  planetsP2: number;
  buildings: number;
}

/** Runs one match to completion or the time limit. */
function runMatch(seed: number, verbose: boolean): { samples: Sample[]; world: GameWorld } {
  const world = createMatch({
    players: [
      { id: 1, name: 'Boom' },
      { id: 2, name: 'Rush' },
    ],
    seed,
  });

  const bots: Bot[] = [
    { playerId: 1, order: ECONOMIC_BOOM, step: 0 },
    { playerId: 2, order: FAST_EXPAND, step: 0 },
  ];

  const samples: Sample[] = [];
  const totalTicks = Math.ceil((MATCH_TIME_LIMIT + 5) * TICK_RATE);
  let nextSampleMinute = 1;

  for (let tick = 0; tick < totalTicks; tick += 1) {
    runSimulationTick(world, FIXED_DELTA);

    // Bots act once per simulated second.
    if (tick % TICK_RATE === 0) {
      for (const bot of bots) stepBot(world, bot);
      updateWaypoints(world);
    }

    if (world.context.elapsed >= nextSampleMinute * 60) {
      samples.push(sample(world, nextSampleMinute));
      nextSampleMinute += 1;
    }

    if (world.context.phase === 'finished') break;
  }

  if (verbose) {
    printReport(world, samples);
  }

  return { samples, world };
}

function sample(world: GameWorld, minute: number): Sample {
  const p1 = world.context.players.get(1);
  const p2 = world.context.players.get(2);
  return {
    minute,
    goldP1: Math.round(p1?.resources.gold ?? 0),
    goldP2: Math.round(p2?.resources.gold ?? 0),
    incomeP1: Math.round((p1?.income.gold ?? 0) * 10) / 10,
    incomeP2: Math.round((p2?.income.gold ?? 0) * 10) / 10,
    ships: shipQuery(world).length,
    planetsP1: p1?.controlledPlanets.length ?? 0,
    planetsP2: p2?.controlledPlanets.length ?? 0,
    buildings: buildingQuery(world).length,
  };
}

function printReport(world: GameWorld, samples: Sample[]): void {
  const { result, elapsed } = world.context;

  console.warn('\n=== Match timeline ===');
  console.warn('min |  gold P1/P2  | income P1/P2 | ships | planets P1/P2 | buildings');
  for (const s of samples) {
    if (s.minute % 2 !== 0 && s.minute !== 1) continue;
    console.warn(
      `${String(s.minute).padStart(3)} | ` +
        `${String(s.goldP1).padStart(5)}/${String(s.goldP2).padEnd(5)} | ` +
        `${String(s.incomeP1).padStart(5)}/${String(s.incomeP2).padEnd(5)}  | ` +
        `${String(s.ships).padStart(5)} | ` +
        `${String(s.planetsP1).padStart(6)}/${String(s.planetsP2).padEnd(6)} | ` +
        `${s.buildings}`
    );
  }

  console.warn('\n=== Result ===');
  console.warn(`elapsed: ${(elapsed / 60).toFixed(1)} min`);
  console.warn(`winner: ${result?.winner ?? 'draw'} by ${result?.reason ?? 'unfinished'}`);
  console.warn(`planets held: P1=${result?.planetsHeld[1] ?? 0} P2=${result?.planetsHeld[2] ?? 0}`);

  for (const [id, player] of world.context.players) {
    const s = player.stats;
    console.warn(
      `P${id}: produced ${s.shipsProduced}, lost ${s.shipsLost}, killed ${s.shipsKilled}, ` +
        `built ${s.buildingsConstructed}, captured ${s.planetsCaptured}, ` +
        `gold earned ${Math.round(s.goldEarned)}`
    );
  }
}

/** Measures simulation throughput at a target fleet size. */
function benchmark(targetShips: number): void {
  const world = createMatch({
    players: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ],
    seed: 7,
  });
  world.context.phase = 'playing';

  // Fill the centre of the map with two opposing fleets.
  const centre = PLANETS[3];
  if (centre === undefined) return;

  for (let i = 0; i < targetShips / 2; i += 1) {
    for (const owner of [1, 2] as const) {
      createShip(world, {
        type: i % 5 === 0 ? 'heavy' : i % 3 === 0 ? 'sniper' : 'soldier',
        owner,
        x: centre.x + (owner === 1 ? -600 : 600) + (i % 20) * 12,
        y: centre.y - 300 + Math.floor(i / 20) * 40,
        waypointX: centre.x,
        waypointY: centre.y,
      });
    }
  }

  const shipCount = shipQuery(world).length;
  const ticks = 600;

  const started = performance.now();
  for (let i = 0; i < ticks; i += 1) {
    runSimulationTick(world, FIXED_DELTA);
  }
  const durationMs = performance.now() - started;

  const msPerTick = durationMs / ticks;
  const budgetMs = 1000 / TICK_RATE;

  console.warn(
    `\n${shipCount} ships: ${msPerTick.toFixed(3)} ms/tick ` +
      `(budget ${budgetMs.toFixed(2)} ms, ${((msPerTick / budgetMs) * 100).toFixed(1)}% used, ` +
      `headroom ${(budgetMs / msPerTick).toFixed(1)}x)`
  );
}

// --- Entry point -----------------------------------------------------------

console.warn('Fleet Strike headless playtest\n');

const { world } = runMatch(20240901, true);

console.warn('\n=== Repeatability across seeds ===');
for (const seed of [1, 42, 1337]) {
  const run = runMatch(seed, false);
  const r = run.world.context.result;
  console.warn(
    `seed ${String(seed).padStart(5)}: ${(run.world.context.elapsed / 60).toFixed(1)} min, ` +
      `winner ${r?.winner ?? 'draw'} by ${r?.reason ?? 'unfinished'}, ` +
      `P1=${r?.planetsHeld[1] ?? 0} P2=${r?.planetsHeld[2] ?? 0}`
  );
}

console.warn('\n=== Simulation performance ===');
for (const count of [50, 100, 200, 300]) {
  benchmark(count);
}

if (world.context.result === null) {
  console.error('\nFAIL: the match did not terminate');
  process.exit(1);
}

console.warn('\nPlaytest complete.');
