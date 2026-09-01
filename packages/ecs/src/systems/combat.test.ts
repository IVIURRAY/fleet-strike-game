import { beforeEach, describe, expect, it } from 'vitest';

import { SHIPS } from '@fleet-strike/config';

import { Health, Shield, Targeting } from '../components';
import { createGameWorld } from '../world';
import type { GameWorld } from '../world';
import { createShip } from '../entities/ship';
import { createProjectile, pooledProjectileCount, recycleProjectile } from '../entities/projectile';
import { combatSystem } from './combat';
import { applyDamage, applyHealing, shieldRegenSystem } from './damage';
import { healthSystem, removalSystem } from './health';
import { movementSystem } from './movement';
import { projectileCollisionSystem } from './projectile';
import { spatialIndexSystem } from './spatial-index';
import { targetingSystem } from './targeting';
import { projectileQuery, shipQuery } from '../queries';
import { addComponent } from 'bitecs';

describe('targeting', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('acquires the nearest enemy within detection range', () => {
    const attacker = ship(world, 'scout', 1, 0, 0);
    const near = ship(world, 'scout', 2, 200, 0);
    ship(world, 'scout', 2, 400, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);

    expect(Targeting.target[attacker]).toBe(near);
  });

  it('ignores friendly ships', () => {
    const attacker = ship(world, 'scout', 1, 0, 0);
    ship(world, 'scout', 1, 100, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);

    expect(Targeting.target[attacker]).toBe(0);
  });

  it('ignores enemies beyond detection range', () => {
    const attacker = ship(world, 'scout', 1, 0, 0);
    // Scout detection range is 450.
    ship(world, 'scout', 2, 900, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);

    expect(Targeting.target[attacker]).toBe(0);
  });

  it('lets a sniper outrange a scout', () => {
    const sniper = ship(world, 'sniper', 1, 0, 0);
    const target = ship(world, 'scout', 2, 800, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);

    // Sniper detection is 950, scout's is 450.
    expect(Targeting.target[sniper]).toBe(target);
    expect(Targeting.target[target]).toBe(0);
  });
});

describe('combat and damage', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('applies light armour reduction', () => {
    // A Scout has 80 HP and Light armour, so damage must stay survivable for
    // the delta to be meaningful.
    const target = ship(world, 'scout', 2, 0, 0);
    const before = Health.current[target] as number;

    applyDamage(world, target, 40, 'bullet');

    expect(before - (Health.current[target] as number)).toBeCloseTo(40 * 0.95, 3);
  });

  it('applies heavy armour reduction', () => {
    const target = ship(world, 'heavy', 2, 0, 0);
    const before = Health.current[target] as number;

    applyDamage(world, target, 100, 'bullet');

    expect(before - (Health.current[target] as number)).toBeCloseTo(100 * 0.6, 3);
  });

  it('gives flak a bonus against light armour', () => {
    const target = ship(world, 'scout', 2, 0, 0);
    const before = Health.current[target] as number;

    applyDamage(world, target, 40, 'flak');

    expect(before - (Health.current[target] as number)).toBeCloseTo(40 * 1.3 * 0.95, 3);
  });

  it('gives rockets a bonus against heavy armour', () => {
    const target = ship(world, 'heavy', 2, 0, 0);
    const before = Health.current[target] as number;

    applyDamage(world, target, 100, 'rocket');

    expect(before - (Health.current[target] as number)).toBeCloseTo(100 * 1.2 * 0.6, 3);
  });

  it('never drives health below zero', () => {
    const target = ship(world, 'scout', 2, 0, 0);
    applyDamage(world, target, 99999, 'bullet');
    expect(Health.current[target]).toBe(0);
  });

  it('ignores damage to an already destroyed entity', () => {
    const target = ship(world, 'scout', 2, 0, 0);
    applyDamage(world, target, 99999, 'bullet');
    expect(applyDamage(world, target, 100, 'bullet')).toBe(0);
  });

  it('fires a hitscan laser without spawning a projectile', () => {
    const sniper = ship(world, 'sniper', 1, 0, 0);
    // Placed at 800 so it is inside the Sniper's 900 range but outside the
    // Soldier's 650 detection range, isolating the Sniper's shot.
    const target = ship(world, 'soldier', 2, 800, 0);
    const before = Health.current[target] as number;

    spatialIndexSystem(world);
    targetingSystem(world, 1);
    // The Sniper has a 2 second charge time, so advance past it.
    combatSystem(world, 3);

    expect(projectileQuery(world)).toHaveLength(0);
    expect(Health.current[target] as number).toBeLessThan(before);
    expect(Targeting.target[sniper]).toBe(target);
  });

  it('spawns a projectile for a ballistic weapon', () => {
    ship(world, 'scout', 1, 0, 0);
    ship(world, 'soldier', 2, 300, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);
    combatSystem(world, 1);

    expect(projectileQuery(world).length).toBeGreaterThan(0);
  });

  it('holds fire when the target is out of weapon range', () => {
    const sniper = ship(world, 'sniper', 1, 0, 0);
    // Inside detection (950) but outside the 900 weapon range.
    ship(world, 'scout', 2, 920, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);
    combatSystem(world, 3);

    expect(projectileQuery(world)).toHaveLength(0);
    expect(Targeting.target[sniper]).not.toBe(0);
  });

  it('respects rate of fire', () => {
    ship(world, 'scout', 1, 0, 0);
    ship(world, 'soldier', 2, 300, 0);

    spatialIndexSystem(world);
    targetingSystem(world, 1);

    // Scout fires 2 shots/sec, so a single 0.1s tick yields one shot then a wait.
    combatSystem(world, 0.1);
    const afterFirst = projectileQuery(world).length;
    combatSystem(world, 0.1);
    expect(projectileQuery(world).length).toBe(afterFirst);
  });
});

describe('projectile collision', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('damages an enemy along the swept path', () => {
    const target = ship(world, 'heavy', 2, 300, 0);
    const before = Health.current[target] as number;

    createProjectile(world, {
      owner: 1,
      weaponType: 'bullet',
      x: 0,
      y: 0,
      damage: 50,
      areaOfEffect: 0,
      speed: 20000,
      angle: 0,
      source: 0,
      target: 0,
      isHoming: false,
      radius: 2,
    });

    spatialIndexSystem(world);
    movementSystem(world, 1 / 60);
    projectileCollisionSystem(world, 1 / 60);

    // Without swept collision this fast projectile would jump past the target.
    expect(Health.current[target] as number).toBeLessThan(before);
  });

  it('does not damage friendly ships', () => {
    const friendly = ship(world, 'heavy', 1, 300, 0);
    const before = Health.current[friendly] as number;

    createProjectile(world, {
      owner: 1,
      weaponType: 'bullet',
      x: 0,
      y: 0,
      damage: 50,
      areaOfEffect: 0,
      speed: 20000,
      angle: 0,
      source: 0,
      target: 0,
      isHoming: false,
      radius: 2,
    });

    spatialIndexSystem(world);
    movementSystem(world, 1 / 60);
    projectileCollisionSystem(world, 1 / 60);

    expect(Health.current[friendly]).toBe(before);
  });

  it('applies splash damage to several targets', () => {
    const a = ship(world, 'scout', 2, 300, 0);
    const b = ship(world, 'scout', 2, 320, 0);

    createProjectile(world, {
      owner: 1,
      weaponType: 'bomb',
      x: 0,
      y: 0,
      damage: 120,
      areaOfEffect: 150,
      speed: 20000,
      angle: 0,
      source: 0,
      target: 0,
      isHoming: false,
      radius: 5,
    });

    spatialIndexSystem(world);
    movementSystem(world, 1 / 60);
    projectileCollisionSystem(world, 1 / 60);

    expect(Health.current[a] as number).toBeLessThan(80);
    expect(Health.current[b] as number).toBeLessThan(80);
  });

  it('recycles projectile entity ids', () => {
    const projectile = createProjectile(world, {
      owner: 1,
      weaponType: 'bullet',
      x: 0,
      y: 0,
      damage: 1,
      areaOfEffect: 0,
      speed: 100,
      angle: 0,
      source: 0,
      target: 0,
      isHoming: false,
      radius: 2,
    });

    recycleProjectile(world, projectile);
    expect(pooledProjectileCount(world)).toBe(1);

    const reused = createProjectile(world, {
      owner: 1,
      weaponType: 'bullet',
      x: 0,
      y: 0,
      damage: 1,
      areaOfEffect: 0,
      speed: 100,
      angle: 0,
      source: 0,
      target: 0,
      isHoming: false,
      radius: 2,
    });

    expect(reused).toBe(projectile);
    expect(pooledProjectileCount(world)).toBe(0);
  });
});

describe('shields', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('absorbs damage before hull hp', () => {
    const target = ship(world, 'heavy', 2, 0, 0);
    addComponent(world, Shield, target);
    Shield.current[target] = 500;
    Shield.max[target] = 500;
    Shield.regenRate[target] = 50;
    Shield.regenDelay[target] = 5;

    const hullBefore = Health.current[target] as number;
    applyDamage(world, target, 100, 'bullet');

    expect(Health.current[target]).toBe(hullBefore);
    expect(Shield.current[target] as number).toBeLessThan(500);
  });

  it('overflows into the hull when the shield breaks', () => {
    const target = ship(world, 'heavy', 2, 0, 0);
    addComponent(world, Shield, target);
    Shield.current[target] = 10;
    Shield.max[target] = 500;
    Shield.regenRate[target] = 50;
    Shield.regenDelay[target] = 5;

    applyDamage(world, target, 200, 'bullet');

    expect(Shield.current[target]).toBe(0);
    expect(Health.current[target] as number).toBeLessThan(600);
  });

  it('regenerates only after the delay elapses', () => {
    const target = ship(world, 'heavy', 2, 0, 0);
    addComponent(world, Shield, target);
    Shield.current[target] = 100;
    Shield.max[target] = 500;
    Shield.regenRate[target] = 50;
    Shield.regenDelay[target] = 5;
    Health.timeSinceDamage[target] = 0;

    shieldRegenSystem(world, 1);
    expect(Shield.current[target]).toBe(100);

    shieldRegenSystem(world, 10);
    expect(Shield.current[target] as number).toBeGreaterThan(100);
  });
});

describe('healing and death', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('heals up to maximum hp', () => {
    const target = ship(world, 'heavy', 1, 0, 0);
    applyDamage(world, target, 200, 'bullet');
    const damaged = Health.current[target] as number;

    applyHealing(world, target, 99999);
    expect(Health.current[target]).toBe(Health.max[target]);
    expect(damaged).toBeLessThan(600);
  });

  it('cannot revive a destroyed entity', () => {
    const target = ship(world, 'scout', 1, 0, 0);
    applyDamage(world, target, 99999, 'bullet');
    expect(applyHealing(world, target, 100)).toBe(0);
  });

  it('removes destroyed ships and refunds manpower', () => {
    world.context.players.set(1, makePlayer(1));
    const target = ship(world, 'heavy', 1, 0, 0);
    const player = world.context.players.get(1);
    const manpowerBefore = player?.resources.manpower ?? 0;

    applyDamage(world, target, 99999, 'bullet');
    healthSystem(world);
    removalSystem(world);

    expect(shipQuery(world)).not.toContain(target);
    // A Heavy costs 5 manpower, which is refunded on death.
    expect(player?.resources.manpower).toBe(manpowerBefore + SHIPS.heavy.cost.manpower);
    expect(player?.stats.shipsLost).toBe(1);
  });
});

function ship(
  world: GameWorld,
  type: keyof typeof SHIPS,
  owner: 1 | 2,
  x: number,
  y: number
): number {
  return createShip(world, { type, owner, x, y, waypointX: x, waypointY: y });
}

function makePlayer(id: 1 | 2) {
  return {
    id,
    name: `P${id}`,
    status: 'connected' as const,
    resources: { gold: 100, manpower: 10, crystal: 0, gas: 0, tungsten: 0 },
    income: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
    caps: { manpower: 200, crystal: 500, gas: 500, tungsten: 500 },
    waypoint: { x: 0, y: 0 },
    controlledPlanets: [],
    upgradeDiscount: 0,
    productionSpeedBonus: 0,
    stats: {
      shipsProduced: 0,
      shipsLost: 0,
      shipsKilled: 0,
      buildingsConstructed: 0,
      goldEarned: 0,
      planetsCaptured: 0,
    },
  };
}
