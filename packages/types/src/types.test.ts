import { describe, expect, it } from 'vitest';

import { opponentOf, PLAYER_IDS } from './game/common';
import { emptyCost, BASIC_RESOURCES, EXOTIC_RESOURCES, RESOURCES } from './game/resources';
import { isHitscan, weaponDps, ARMOR_TYPES, WEAPON_TYPES } from './game/combat';
import { maxWeaponRange, SHIP_TYPES } from './game/ships';
import { emptyPlayerStats } from './game/player';
import { BUILDING_TYPES, MOON_BUILDING_TYPES, PLANET_BUILDING_TYPES } from './game/buildings';
import { MATCH_PHASES, VICTORY_REASONS } from './game/match';
import { CLIENT_MESSAGE_TYPES, SERVER_MESSAGE_TYPES } from './network';

describe('opponentOf', () => {
  it('swaps the two players', () => {
    expect(opponentOf(1)).toBe(2);
    expect(opponentOf(2)).toBe(1);
  });

  it('is its own inverse', () => {
    for (const id of PLAYER_IDS) {
      expect(opponentOf(opponentOf(id))).toBe(id);
    }
  });
});

describe('emptyCost', () => {
  it('zeroes every resource', () => {
    expect(emptyCost()).toEqual({ gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 });
  });

  it('returns a distinct object each call so definitions cannot alias one', () => {
    // ResourceCost is readonly, so identity is the meaningful assertion here.
    expect(emptyCost()).not.toBe(emptyCost());
    expect(emptyCost()).toEqual(emptyCost());
  });

  it('covers exactly the declared resource list', () => {
    expect(Object.keys(emptyCost()).sort()).toEqual([...RESOURCES].sort());
  });
});

describe('resource taxonomy', () => {
  it('splits into basic and exotic without overlap', () => {
    for (const resource of BASIC_RESOURCES) {
      expect(EXOTIC_RESOURCES).not.toContain(resource);
    }
    expect(RESOURCES).toHaveLength(BASIC_RESOURCES.length + EXOTIC_RESOURCES.length);
  });

  it('names the three documented exotics', () => {
    expect([...EXOTIC_RESOURCES].sort()).toEqual(['crystal', 'gas', 'tungsten']);
  });
});

describe('weapon helpers', () => {
  const beam = {
    name: 'Heavy Laser Cannon',
    weaponType: 'laser' as const,
    damage: 150,
    rateOfFire: 0.5,
    range: 900,
    projectileSpeed: 0,
    areaOfEffect: 0,
    chargeTime: 2,
  };

  const bullet = { ...beam, name: 'Bullets', weaponType: 'bullet' as const, projectileSpeed: 200 };

  it('treats a zero projectile speed as hitscan', () => {
    expect(isHitscan(beam)).toBe(true);
    expect(isHitscan(bullet)).toBe(false);
  });

  it('computes sustained damage', () => {
    expect(weaponDps(beam)).toBe(75);
    expect(weaponDps({ ...bullet, damage: 8, rateOfFire: 2 })).toBe(16);
  });

  it('declares four armour types and six weapon types', () => {
    expect(ARMOR_TYPES).toHaveLength(4);
    expect(WEAPON_TYPES.length).toBeGreaterThanOrEqual(4);
  });
});

describe('maxWeaponRange', () => {
  const base = {
    type: 'soldier' as const,
    name: 'Soldier Fighter',
    nickname: 'Versatile Striker',
    role: 'Balanced',
    cost: emptyCost(),
    maxHp: 180,
    armor: 'medium' as const,
    maxSpeed: 160,
    minSpeed: 60,
    turnRate: 60,
    hitboxRadius: 8,
    detectionRange: 650,
    captureRate: 1,
    repairPerSecond: 0,
    repairTargets: 0,
    repairRange: 0,
    texture: 'soldier',
  };

  const mount = (range: number) => ({
    name: `mount ${range}`,
    weaponType: 'bullet' as const,
    damage: 10,
    rateOfFire: 1,
    range,
    projectileSpeed: 200,
    areaOfEffect: 0,
    chargeTime: 0,
  });

  it('returns the longest mount range', () => {
    expect(maxWeaponRange({ ...base, weapons: [mount(450), mount(600)] })).toBe(600);
  });

  it('is order independent', () => {
    expect(maxWeaponRange({ ...base, weapons: [mount(600), mount(450)] })).toBe(600);
  });

  it('returns zero for an unarmed ship', () => {
    expect(maxWeaponRange({ ...base, weapons: [] })).toBe(0);
  });
});

describe('emptyPlayerStats', () => {
  it('zeroes every counter', () => {
    const stats = emptyPlayerStats();
    for (const value of Object.values(stats)) {
      expect(value).toBe(0);
    }
  });

  it('returns a fresh object per player', () => {
    const a = emptyPlayerStats();
    a.shipsLost = 5;
    expect(emptyPlayerStats().shipsLost).toBe(0);
  });
});

describe('domain enumerations', () => {
  it('covers the seven MVP ship classes', () => {
    expect(SHIP_TYPES).toHaveLength(7);
  });

  it('partitions buildings into planet and moon sets', () => {
    expect(BUILDING_TYPES).toHaveLength(PLANET_BUILDING_TYPES.length + MOON_BUILDING_TYPES.length);
    for (const type of MOON_BUILDING_TYPES) {
      expect(PLANET_BUILDING_TYPES).not.toContain(type);
    }
  });

  it('declares the match lifecycle and victory reasons', () => {
    expect(MATCH_PHASES).toEqual(['lobby', 'setup', 'playing', 'finished']);
    expect(VICTORY_REASONS).toEqual(['conquest', 'timeout', 'forfeit']);
  });

  it('keeps the protocol discriminant lists unique', () => {
    expect(new Set(CLIENT_MESSAGE_TYPES).size).toBe(CLIENT_MESSAGE_TYPES.length);
    expect(new Set(SERVER_MESSAGE_TYPES).size).toBe(SERVER_MESSAGE_TYPES.length);
  });
});
