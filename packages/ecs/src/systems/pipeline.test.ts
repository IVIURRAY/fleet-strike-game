import { describe, expect, it } from 'vitest';

import {
  CAPTURE_THRESHOLD,
  FIXED_DELTA,
  MATCH_TIME_LIMIT,
  PLANETS,
  SETUP_DURATION,
  STARTING_GOLD,
} from '@fleet-strike/config';

import { Capturable, Owner, Position } from '../components';
import { createMatch, findPlanetEntity, slotPosition } from '../match';
import { createBuilding } from '../entities/building';
import { createShip } from '../entities/ship';
import { runSimulationTick } from './pipeline';
import { finish, forfeit } from './victory';
import { shipQuery } from '../queries';
import type { GameWorld } from '../world';

function match(): GameWorld {
  return createMatch({ players: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
}

/** Advances the world by `seconds` of simulated time at the fixed timestep. */
function advance(world: GameWorld, seconds: number): void {
  const ticks = Math.round(seconds / FIXED_DELTA);
  for (let i = 0; i < ticks; i += 1) {
    runSimulationTick(world);
  }
}

describe('match lifecycle', () => {
  it('starts in the setup phase and transitions to playing', () => {
    const world = match();
    expect(world.context.phase).toBe('setup');

    advance(world, SETUP_DURATION - 1);
    expect(world.context.phase).toBe('setup');

    advance(world, 2);
    expect(world.context.phase).toBe('playing');
  });

  it('accrues income during setup', () => {
    const world = match();
    advance(world, 10);
    expect(world.context.players.get(1)!.resources.gold).toBeGreaterThan(STARTING_GOLD);
  });

  it('advances the tick counter and elapsed clock together', () => {
    const world = match();
    advance(world, 5);
    expect(world.context.tick).toBe(300);
    expect(world.context.elapsed).toBeCloseTo(5, 1);
  });

  it('does nothing once finished', () => {
    const world = match();
    finish(world, 1, 'conquest');
    const tickBefore = world.context.tick;
    advance(world, 5);
    expect(world.context.tick).toBe(tickBefore);
  });
});

describe('full match simulation', () => {
  it('runs two minutes without throwing and keeps state sane', () => {
    const world = match();
    advance(world, 120);

    expect(world.context.phase).toBe('playing');

    for (const player of world.context.players.values()) {
      expect(player.resources.gold).toBeGreaterThanOrEqual(0);
      expect(player.resources.manpower).toBeGreaterThanOrEqual(0);
      expect(player.resources.manpower).toBeLessThanOrEqual(player.caps.manpower);
      expect(Number.isFinite(player.resources.gold)).toBe(true);
    }

    // Every surviving ship must be inside the world bounds with finite state.
    for (const ship of shipQuery(world)) {
      expect(Number.isFinite(Position.x[ship])).toBe(true);
      expect(Number.isFinite(Position.y[ship])).toBe(true);
    }
  });

  it('sends the starting fleets to their waypoints and captures neutral planets', () => {
    const world = match();
    // Long enough for a 220 u/s Scout to cross the 3000 unit lane and capture.
    advance(world, 120);

    const goldPlanet = findPlanetEntity(world, 1);
    const tungstenPlanet = findPlanetEntity(world, 5);

    // Player 1's fleet pushes the Gold Planet bar negative, player 2's pushes
    // the Tungsten Planet bar positive.
    expect(Capturable.progress[goldPlanet] as number).toBeLessThan(0);
    expect(Capturable.progress[tungstenPlanet] as number).toBeGreaterThan(0);
  });

  it('produces ships from a factory over time', () => {
    const world = match();
    advance(world, SETUP_DURATION + 1);

    const planet = PLANETS[0]!;
    createBuilding(world, {
      type: 'scoutFactory',
      owner: 1,
      ...slotPosition(planet.x, planet.y, planet.radius, 4),
      planetIndex: 0,
      parentEntity: findPlanetEntity(world, 0),
      instant: true,
    });

    const before = countShips(world, 1);
    // Two full 45 second production cycles.
    advance(world, 95);
    expect(countShips(world, 1)).toBeGreaterThan(before);
  });

  it('resolves combat when two fleets meet', () => {
    const world = match();
    world.context.phase = 'playing';

    const x = PLANETS[3]!.x;
    const y = PLANETS[3]!.y;

    for (let i = 0; i < 6; i += 1) {
      createShip(world, {
        type: 'soldier',
        owner: 1,
        x: x - 200 + i * 10,
        y,
        waypointX: x,
        waypointY: y,
      });
      createShip(world, {
        type: 'soldier',
        owner: 2,
        x: x + 200 + i * 10,
        y,
        waypointX: x,
        waypointY: y,
      });
    }

    const before = shipQuery(world).length;
    advance(world, 90);

    // Sustained combat must eventually destroy ships on at least one side.
    expect(shipQuery(world).length).toBeLessThan(before);
  });

  it('is deterministic for a fixed seed', () => {
    const a = createMatch({ players: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], seed: 99 });
    const b = createMatch({ players: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], seed: 99 });

    advance(a, 60);
    advance(b, 60);

    expect(a.context.players.get(1)!.resources.gold).toBe(
      b.context.players.get(1)!.resources.gold
    );
    expect(shipQuery(a).length).toBe(shipQuery(b).length);
  });
});

describe('victory conditions', () => {
  it('awards conquest when one player holds all seven planets', () => {
    const world = match();
    world.context.phase = 'playing';

    giveAllPlanetsTo(world, 1);

    advance(world, 2);

    expect(world.context.phase).toBe('finished');
    expect(world.context.result?.winner).toBe(1);
    expect(world.context.result?.reason).toBe('conquest');
    expect(world.context.result?.planetsHeld[1]).toBe(PLANETS.length);
  });

  it('does not end the match while planets are split', () => {
    const world = match();
    advance(world, SETUP_DURATION + 5);
    expect(world.context.phase).toBe('playing');
    expect(world.context.result).toBeNull();
  });

  it('ends on the time limit with the planet leader winning', () => {
    const world = match();
    world.context.phase = 'playing';
    world.context.elapsed = MATCH_TIME_LIMIT;

    Owner.playerId[findPlanetEntity(world, 1)] = 1;
    Owner.playerId[findPlanetEntity(world, 2)] = 1;

    advance(world, 2);

    expect(world.context.phase).toBe('finished');
    expect(world.context.result?.reason).toBe('timeout');
    expect(world.context.result?.winner).toBe(1);
    expect(world.context.result?.planetsHeld[1]).toBeGreaterThan(
      world.context.result!.planetsHeld[2]
    );
  });

  it('declares a draw when planets are level at the time limit', () => {
    const world = match();
    world.context.phase = 'playing';
    world.context.elapsed = MATCH_TIME_LIMIT;

    advance(world, 2);

    expect(world.context.result?.reason).toBe('timeout');
    expect(world.context.result?.winner).toBeNull();
  });

  it('awards the win to the opponent on forfeit', () => {
    const world = match();
    world.context.phase = 'playing';
    forfeit(world, 1);

    expect(world.context.phase).toBe('finished');
    expect(world.context.result?.winner).toBe(2);
    expect(world.context.result?.reason).toBe('forfeit');
  });

  it('records match duration and planet counts in the result', () => {
    const world = match();
    world.context.phase = 'playing';
    world.context.elapsed = 123;
    finish(world, 2, 'conquest');

    expect(world.context.result?.durationSeconds).toBe(123);
    expect(world.context.result?.planetsHeld[2]).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Assigns every planet to one player.
 *
 * Ownership is derived from the capture bar, so the bar must be pinned to that
 * player's end as well; setting `Owner` alone would let the capture system flip
 * the planet straight back on the next tick.
 */
function giveAllPlanetsTo(world: GameWorld, playerId: 1 | 2): void {
  const pinned = playerId === 1 ? -CAPTURE_THRESHOLD : CAPTURE_THRESHOLD;
  for (let index = 0; index < PLANETS.length; index += 1) {
    const entity = findPlanetEntity(world, index);
    Owner.playerId[entity] = playerId;
    Capturable.progress[entity] = pinned;
  }
}

function countShips(world: GameWorld, owner: 1 | 2): number {
  let count = 0;
  for (const ship of shipQuery(world)) {
    if (Owner.playerId[ship] === owner) count += 1;
  }
  return count;
}
