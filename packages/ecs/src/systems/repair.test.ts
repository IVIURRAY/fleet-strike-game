import { beforeEach, describe, expect, it } from 'vitest';

import { PLANETS, SHIPS } from '@fleet-strike/config';

import { Health, Owner } from '../components';
import { createMatch, findPlanetEntity } from '../match';
import { createBuilding } from '../entities/building';
import { createShip } from '../entities/ship';
import { applyDamage } from './damage';
import { repairSystem } from './repair';
import { spatialIndexSystem } from './spatial-index';
import type { GameWorld } from '../world';

function newMatch(): GameWorld {
  const world = createMatch({ players: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
  world.context.phase = 'playing';
  return world;
}

describe('repairSystem with medics', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newMatch();
  });

  it('heals a damaged ally within beam range', () => {
    const medic = createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });
    const ally = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 1100,
      y: 3000,
      waypointX: 1100,
      waypointY: 3000,
    });

    applyDamage(world, ally, 300, 'bullet');
    const damaged = Health.current[ally] as number;

    spatialIndexSystem(world);
    repairSystem(world, 1);

    // Medics restore 30 HP/second per beam.
    expect(Health.current[ally] as number).toBeCloseTo(damaged + 30, 3);
    expect(medic).toBeGreaterThan(0);
  });

  it('does not heal beyond maximum hp', () => {
    createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });
    const ally = createShip(world, {
      type: 'soldier',
      owner: 1,
      x: 1050,
      y: 3000,
      waypointX: 1050,
      waypointY: 3000,
    });

    spatialIndexSystem(world);
    repairSystem(world, 100);

    expect(Health.current[ally]).toBe(SHIPS.soldier.maxHp);
  });

  it('never heals enemies', () => {
    createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });
    const enemy = createShip(world, {
      type: 'soldier',
      owner: 2,
      x: 1050,
      y: 3000,
      waypointX: 1050,
      waypointY: 3000,
    });

    applyDamage(world, enemy, 100, 'bullet');
    const damaged = Health.current[enemy] as number;

    spatialIndexSystem(world);
    repairSystem(world, 1);

    expect(Health.current[enemy]).toBe(damaged);
  });

  it('ignores allies beyond beam range', () => {
    createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });
    // Medic repair range is 300.
    const ally = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 1600,
      y: 3000,
      waypointX: 1600,
      waypointY: 3000,
    });

    applyDamage(world, ally, 300, 'bullet');
    const damaged = Health.current[ally] as number;

    spatialIndexSystem(world);
    repairSystem(world, 1);

    expect(Health.current[ally]).toBe(damaged);
  });

  it('services at most three allies at once', () => {
    createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });

    const allies: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const ally = createShip(world, {
        type: 'heavy',
        owner: 1,
        x: 1050 + i * 10,
        y: 3000,
        waypointX: 1050,
        waypointY: 3000,
      });
      // Stagger the damage so the priority ordering is unambiguous.
      applyDamage(world, ally, 200 + i * 30, 'bullet');
      allies.push(ally);
    }

    const before = allies.map((ally) => Health.current[ally] as number);

    spatialIndexSystem(world);
    repairSystem(world, 1);

    const healed = allies.filter(
      (ally, i) => (Health.current[ally] as number) > (before[i] as number)
    );
    // The Medic has 3 beams, so only 3 of the 5 wounded ships gain HP.
    expect(healed).toHaveLength(3);
  });

  it('prioritises the most damaged ally', () => {
    createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });

    const lightlyHurt = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 1050,
      y: 3000,
      waypointX: 1050,
      waypointY: 3000,
    });
    const badlyHurt = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 1060,
      y: 3000,
      waypointX: 1060,
      waypointY: 3000,
    });
    const alsoBadlyHurt = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 1070,
      y: 3000,
      waypointX: 1070,
      waypointY: 3000,
    });
    const worst = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 1080,
      y: 3000,
      waypointX: 1080,
      waypointY: 3000,
    });

    applyDamage(world, lightlyHurt, 20, 'bullet');
    applyDamage(world, badlyHurt, 400, 'bullet');
    applyDamage(world, alsoBadlyHurt, 420, 'bullet');
    applyDamage(world, worst, 450, 'bullet');

    const lightlyHurtBefore = Health.current[lightlyHurt] as number;

    spatialIndexSystem(world);
    repairSystem(world, 1);

    // The three worst wounded are treated; the barely scratched one is not.
    expect(Health.current[lightlyHurt]).toBe(lightlyHurtBefore);
    expect(Health.current[worst] as number).toBeGreaterThan(150);
  });

  it('does not resurrect a destroyed ally', () => {
    createShip(world, {
      type: 'medic',
      owner: 1,
      x: 1000,
      y: 3000,
      waypointX: 1000,
      waypointY: 3000,
    });
    const ally = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 1050,
      y: 3000,
      waypointX: 1050,
      waypointY: 3000,
    });

    applyDamage(world, ally, 9999, 'bullet');

    spatialIndexSystem(world);
    repairSystem(world, 5);

    expect(Health.current[ally]).toBe(0);
  });
});

describe('repairSystem with repair stations', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = newMatch();
  });

  it('heals every ally inside the station aura', () => {
    const planet = PLANETS[0]!;
    const moon = planet.moons[0]!;
    const moonX = planet.x + moon.orbitRadius;

    createBuilding(world, {
      type: 'repairStation',
      owner: 1,
      x: moonX,
      y: planet.y,
      planetIndex: 0,
      parentEntity: findPlanetEntity(world, 0),
      instant: true,
    });

    const allies: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const ally = createShip(world, {
        type: 'heavy',
        owner: 1,
        x: moonX + 50 + i * 20,
        y: planet.y,
        waypointX: moonX,
        waypointY: planet.y,
      });
      applyDamage(world, ally, 300, 'bullet');
      allies.push(ally);
    }

    spatialIndexSystem(world);
    repairSystem(world, 1);

    // Heavy armour halves the 300 damage to 180, leaving 420 HP, then the
    // station restores 20 HP/sec to every ally in range with no beam limit.
    for (const ally of allies) {
      expect(Health.current[ally] as number).toBeCloseTo(440, 3);
    }
  });

  it('does not heal enemies inside the aura', () => {
    const planet = PLANETS[0]!;
    const moon = planet.moons[0]!;
    const moonX = planet.x + moon.orbitRadius;

    createBuilding(world, {
      type: 'repairStation',
      owner: 1,
      x: moonX,
      y: planet.y,
      planetIndex: 0,
      parentEntity: findPlanetEntity(world, 0),
      instant: true,
    });

    const enemy = createShip(world, {
      type: 'heavy',
      owner: 2,
      x: moonX + 60,
      y: planet.y,
      waypointX: moonX,
      waypointY: planet.y,
    });
    applyDamage(world, enemy, 300, 'bullet');
    const damaged = Health.current[enemy] as number;

    spatialIndexSystem(world);
    repairSystem(world, 1);

    expect(Health.current[enemy]).toBe(damaged);
    expect(Owner.playerId[enemy]).toBe(2);
  });
});
