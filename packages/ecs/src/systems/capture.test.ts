import { beforeEach, describe, expect, it } from 'vitest';

import { CAPTURE_RADIUS, CAPTURE_THRESHOLD, MAX_CAPTURE_RATE, PLANETS } from '@fleet-strike/config';

import { Capturable, Owner, Parent } from '../components';
import { createMatch, findPlanetEntity } from '../match';
import { orbitalQuery } from '../queries';
import { captureSystem, updatePlanetControl } from './capture';
import { spatialIndexSystem } from './spatial-index';
import { createShip } from '../entities/ship';
import type { GameWorld } from '../world';

describe('captureSystem', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createMatch({
      players: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
    });
    world.context.phase = 'playing';
  });

  it('starts capitals fully held and neutrals at zero', () => {
    const homeA = findPlanetEntity(world, 0);
    const homeB = findPlanetEntity(world, 6);
    const centre = findPlanetEntity(world, 3);

    expect(Capturable.progress[homeA]).toBe(-CAPTURE_THRESHOLD);
    expect(Capturable.progress[homeB]).toBe(CAPTURE_THRESHOLD);
    expect(Capturable.progress[centre]).toBe(0);
    expect(Owner.playerId[centre]).toBe(0);
  });

  it('moves the bar toward the player with ships present', () => {
    const centre = findPlanetEntity(world, 3);
    const planet = PLANETS[3]!;
    spawnAt(world, 1, planet.x, planet.y, 3);

    spatialIndexSystem(world);
    captureSystem(world, 1);

    // Player 1 pushes the bar negative.
    expect(Capturable.progress[centre] as number).toBeLessThan(0);
    expect(Capturable.presenceP1[centre]).toBe(3);
  });

  it('captures a neutral planet after enough time', () => {
    const centre = findPlanetEntity(world, 3);
    const planet = PLANETS[3]!;
    spawnAt(world, 2, planet.x, planet.y, 5);

    for (let i = 0; i < 60; i += 1) {
      spatialIndexSystem(world);
      captureSystem(world, 1);
    }

    expect(Owner.playerId[centre]).toBe(2);
  });

  it('nets out opposing fleets', () => {
    const centre = findPlanetEntity(world, 3);
    const planet = PLANETS[3]!;
    spawnAt(world, 1, planet.x, planet.y, 4);
    spawnAt(world, 2, planet.x + 40, planet.y, 4);

    spatialIndexSystem(world);
    captureSystem(world, 1);

    // Equal presence means no movement.
    expect(Capturable.progress[centre]).toBe(0);
  });

  it('gives engineers double capture rate', () => {
    const centre = findPlanetEntity(world, 3);
    const planet = PLANETS[3]!;
    // One Engineer versus one Scout: the Engineer wins 2 to 1.
    createShip(world, {
      type: 'engineer',
      owner: 1,
      x: planet.x,
      y: planet.y,
      waypointX: planet.x,
      waypointY: planet.y,
    });
    createShip(world, {
      type: 'scout',
      owner: 2,
      x: planet.x + 30,
      y: planet.y,
      waypointX: planet.x,
      waypointY: planet.y,
    });

    spatialIndexSystem(world);
    captureSystem(world, 1);

    expect(Capturable.progress[centre] as number).toBeCloseTo(-1, 4);
  });

  it('ignores ships outside the capture radius', () => {
    const centre = findPlanetEntity(world, 3);
    const planet = PLANETS[3]!;
    spawnAt(world, 1, planet.x + CAPTURE_RADIUS + 200, planet.y, 3);

    spatialIndexSystem(world);
    captureSystem(world, 1);

    expect(Capturable.progress[centre]).toBe(0);
    expect(Capturable.presenceP1[centre]).toBe(0);
  });

  it('clamps the net capture rate so huge fleets cannot flip instantly', () => {
    const centre = findPlanetEntity(world, 3);
    const planet = PLANETS[3]!;
    // 200 ships would be 200 points/second without the clamp.
    spawnAt(world, 1, planet.x, planet.y, 200);

    spatialIndexSystem(world);
    captureSystem(world, 1);

    expect(Math.abs(Capturable.progress[centre] as number)).toBeCloseTo(MAX_CAPTURE_RATE, 4);
    expect(Math.abs(Capturable.progress[centre] as number)).toBeLessThan(CAPTURE_THRESHOLD);
  });

  it('transfers moons and buildings with the planet', () => {
    const homeA = findPlanetEntity(world, 0);
    const planet = PLANETS[0]!;

    // Overwhelm the capital with player 2 ships.
    spawnAt(world, 2, planet.x, planet.y, 30);

    for (let i = 0; i < 100; i += 1) {
      spatialIndexSystem(world);
      captureSystem(world, 1);
    }

    expect(Owner.playerId[homeA]).toBe(2);

    const moonOwners = collectMoonOwners(world, homeA);
    expect(moonOwners).toHaveLength(planet.moons.length);
    expect(moonOwners.every((owner) => owner === 2)).toBe(true);
  });

  it('recomputes controlled planet lists', () => {
    spatialIndexSystem(world);
    updatePlanetControl(world);

    expect(world.context.players.get(1)?.controlledPlanets).toEqual([0]);
    expect(world.context.players.get(2)?.controlledPlanets).toEqual([6]);
  });
});

function spawnAt(world: GameWorld, owner: 1 | 2, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i += 1) {
    createShip(world, {
      type: 'scout',
      owner,
      x: x + (i % 10) * 4,
      y: y + Math.floor(i / 10) * 4,
      waypointX: x,
      waypointY: y,
    });
  }
}

function collectMoonOwners(world: GameWorld, planetEntity: number): number[] {
  const owners: number[] = [];
  const moons = orbitalQuery(world);
  for (let i = 0; i < moons.length; i += 1) {
    const moon = moons[i] as number;
    if (Parent.entity[moon] !== planetEntity) continue;
    owners.push(Owner.playerId[moon] as number);
  }
  return owners;
}
