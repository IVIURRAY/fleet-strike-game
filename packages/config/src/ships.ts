/**
 * Ship statistics for the seven MVP classes.
 *
 * Source: docs/Complete_Units_and_Buildings.md ("MVP Core Units"). Every
 * number below is taken verbatim from that document unless annotated.
 *
 * Two conventions applied throughout:
 *  - `detectionRange` is the ship's longest weapon range plus 50, matching the
 *    documented Scout prefab (400 range, 450 detection).
 *  - `hitboxRadius` is the larger of the documented sprite dimensions, matching
 *    the docs' "hitbox radius (5 units)" example for a small ship.
 *  - Per-unit weapon ranges override the looser weapon-class ranges, which the
 *    docs contradict for almost every unit.
 */

import type { ShipDefinition, ShipType } from '@fleet-strike/types';

export const SHIPS: Readonly<Record<ShipType, ShipDefinition>> = {
  scout: {
    type: 'scout',
    name: 'Scout Fighter',
    nickname: 'Swift Interceptor',
    role: 'Fast reconnaissance and swarm fighter',
    cost: { gold: 10, manpower: 1, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 80,
    armor: 'light',
    maxSpeed: 220,
    minSpeed: 80,
    turnRate: 45,
    hitboxRadius: 5,
    detectionRange: 450,
    weapons: [
      {
        name: 'Small Caliber Bullets',
        weaponType: 'bullet',
        damage: 8,
        rateOfFire: 2,
        range: 400,
        projectileSpeed: 200,
        areaOfEffect: 0,
        chargeTime: 0,
      },
    ],
    captureRate: 1,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'scout_ship',
  },

  soldier: {
    type: 'soldier',
    name: 'Soldier Fighter',
    nickname: 'Versatile Striker',
    role: 'Balanced all-purpose fighter',
    cost: { gold: 25, manpower: 2, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 180,
    armor: 'medium',
    maxSpeed: 160,
    minSpeed: 60,
    turnRate: 60,
    hitboxRadius: 8,
    detectionRange: 650,
    weapons: [
      {
        name: 'Small Rockets',
        weaponType: 'rocket',
        damage: 40,
        rateOfFire: 0.5,
        range: 600,
        projectileSpeed: 150,
        areaOfEffect: 0,
        chargeTime: 0,
      },
      {
        name: 'Medium Bullets',
        weaponType: 'bullet',
        damage: 12,
        rateOfFire: 3,
        range: 450,
        projectileSpeed: 250,
        areaOfEffect: 0,
        chargeTime: 0,
      },
    ],
    captureRate: 1,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'soldier_ship',
  },

  heavy: {
    type: 'heavy',
    name: 'Heavy Gunship',
    nickname: 'Assault Juggernaut',
    role: 'Slow tank with massive firepower',
    cost: { gold: 100, manpower: 5, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 600,
    armor: 'heavy',
    maxSpeed: 80,
    minSpeed: 40,
    turnRate: 90,
    hitboxRadius: 15,
    detectionRange: 550,
    weapons: [
      // Documented as "Dual Large Caliber Cannons, 60 damage, 1 shot/sec each"
      // for a stated 120 DPS. Modelled as one mount firing twice per second.
      {
        name: 'Dual Large Caliber Cannons',
        weaponType: 'bullet',
        damage: 60,
        rateOfFire: 2,
        range: 500,
        projectileSpeed: 200,
        areaOfEffect: 0,
        chargeTime: 0,
      },
      {
        name: 'Flak Turret',
        weaponType: 'flak',
        damage: 20,
        rateOfFire: 3,
        range: 450,
        projectileSpeed: 400,
        areaOfEffect: 60,
        chargeTime: 0,
      },
    ],
    captureRate: 1,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'heavy_ship',
  },

  medic: {
    type: 'medic',
    name: 'Medic Support Ship',
    nickname: 'Field Hospital',
    role: 'Fleet healer and force multiplier',
    cost: { gold: 60, manpower: 3, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 150,
    armor: 'medium',
    maxSpeed: 120,
    minSpeed: 50,
    turnRate: 55,
    hitboxRadius: 10,
    detectionRange: 400,
    weapons: [
      // The docs give only "8 DPS" for the point defence mount, with no
      // damage-per-shot or rate of fire. Split as 4 damage at 2 shots/sec.
      {
        name: 'Small Caliber Point Defense',
        weaponType: 'bullet',
        damage: 4,
        rateOfFire: 2,
        range: 350,
        projectileSpeed: 250,
        areaOfEffect: 0,
        chargeTime: 0,
      },
    ],
    captureRate: 1,
    repairPerSecond: 30,
    repairTargets: 3,
    repairRange: 300,
    texture: 'medic_ship',
  },

  engineer: {
    type: 'engineer',
    name: 'Engineer Constructor',
    nickname: 'Planetary Specialist',
    role: 'Planet capture specialist',
    cost: { gold: 50, manpower: 3, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 140,
    armor: 'medium',
    maxSpeed: 100,
    minSpeed: 45,
    turnRate: 65,
    hitboxRadius: 9,
    detectionRange: 400,
    weapons: [
      {
        name: 'Welding Laser',
        weaponType: 'laser',
        damage: 15,
        rateOfFire: 1.5,
        range: 350,
        projectileSpeed: 0,
        areaOfEffect: 0,
        chargeTime: 0,
      },
    ],
    captureRate: 2,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'engineer_ship',
  },

  bomber: {
    type: 'bomber',
    name: 'Demolition Bomber',
    nickname: 'Siege Breaker',
    role: 'Area damage and structure destruction',
    cost: { gold: 80, manpower: 4, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 220,
    // The unit entry says "Medium-Heavy", which is not one of the four armour
    // classes. The armour table lists "Demo" under Heavy, so Heavy is used.
    armor: 'heavy',
    maxSpeed: 110,
    minSpeed: 50,
    turnRate: 75,
    hitboxRadius: 12,
    detectionRange: 700,
    weapons: [
      {
        name: 'Heavy Bomb Bay',
        weaponType: 'bomb',
        damage: 120,
        rateOfFire: 0.4,
        range: 500,
        projectileSpeed: 180,
        areaOfEffect: 150,
        chargeTime: 0,
      },
      {
        name: 'Rocket Pods',
        weaponType: 'rocket',
        damage: 35,
        rateOfFire: 0.8,
        range: 650,
        projectileSpeed: 150,
        areaOfEffect: 0,
        chargeTime: 0,
      },
    ],
    captureRate: 1,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'bomber_ship',
  },

  sniper: {
    type: 'sniper',
    name: 'Sniper Frigate',
    nickname: 'Precision Eliminator',
    role: 'Long-range assassin',
    cost: { gold: 70, manpower: 3, crystal: 0, gas: 0, tungsten: 0 },
    maxHp: 110,
    armor: 'light',
    maxSpeed: 90,
    minSpeed: 40,
    turnRate: 80,
    hitboxRadius: 11,
    detectionRange: 950,
    weapons: [
      {
        name: 'Heavy Laser Cannon',
        weaponType: 'laser',
        damage: 150,
        rateOfFire: 0.5,
        range: 900,
        projectileSpeed: 0,
        areaOfEffect: 0,
        chargeTime: 2,
      },
    ],
    captureRate: 1,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'sniper_ship',
  },
};

/** Stable numeric ids used to keep network payloads compact. */
export const SHIP_TYPE_IDS: Readonly<Record<ShipType, number>> = {
  scout: 0,
  soldier: 1,
  heavy: 2,
  medic: 3,
  engineer: 4,
  bomber: 5,
  sniper: 6,
};

/** Reverse lookup for `SHIP_TYPE_IDS`. */
export const SHIP_TYPE_BY_ID: readonly ShipType[] = [
  'scout',
  'soldier',
  'heavy',
  'medic',
  'engineer',
  'bomber',
  'sniper',
];
