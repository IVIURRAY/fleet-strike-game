import { describe, expect, it } from 'vitest';

import { SHIP_TYPES, PLANET_BUILDING_TYPES, MOON_BUILDING_TYPES } from '@fleet-strike/types';

import { SHIPS, SHIP_TYPE_BY_ID, SHIP_TYPE_IDS } from './ships';
import { BUILDINGS, maxLevel, nextUpgrade, productionInterval, resourceOutput } from './buildings';
import { CAPTURE_THRESHOLD, MAX_CAPTURE_RATE, PLANETS_TO_WIN } from './balance';
import { MOONS, PLANETS, MAP_LENGTH, PLANET_SPACING, WORLD_WIDTH } from './map';
import { resolveDamage } from './damage';

describe('ship configuration', () => {
  it('defines every MVP ship type', () => {
    for (const type of SHIP_TYPES) {
      expect(SHIPS[type]).toBeDefined();
      expect(SHIPS[type].type).toBe(type);
    }
  });

  it('gives every ship positive hp, speed and at least one weapon', () => {
    for (const type of SHIP_TYPES) {
      const ship = SHIPS[type];
      expect(ship.maxHp).toBeGreaterThan(0);
      expect(ship.maxSpeed).toBeGreaterThan(ship.minSpeed);
      expect(ship.weapons.length).toBeGreaterThan(0);
      expect(ship.cost.gold).toBeGreaterThan(0);
      expect(ship.cost.manpower).toBeGreaterThan(0);
    }
  });

  it('sets detection range at or beyond the longest weapon range', () => {
    for (const type of SHIP_TYPES) {
      const ship = SHIPS[type];
      const longest = Math.max(...ship.weapons.map((weapon) => weapon.range));
      expect(ship.detectionRange).toBeGreaterThanOrEqual(longest);
    }
  });

  it('reproduces the documented scout stat block', () => {
    const scout = SHIPS.scout;
    expect(scout.maxHp).toBe(80);
    expect(scout.maxSpeed).toBe(220);
    expect(scout.turnRate).toBe(45);
    expect(scout.detectionRange).toBe(450);
    expect(scout.cost).toEqual({ gold: 10, manpower: 1, crystal: 0, gas: 0, tungsten: 0 });
    expect(scout.weapons[0]?.damage).toBe(8);
    expect(scout.weapons[0]?.rateOfFire).toBe(2);
    expect(scout.weapons[0]?.range).toBe(400);
  });

  it('keeps numeric ship ids and the reverse lookup in sync', () => {
    for (const type of SHIP_TYPES) {
      expect(SHIP_TYPE_BY_ID[SHIP_TYPE_IDS[type]]).toBe(type);
    }
  });

  it('honours the documented ten-scouts-per-heavy cost ratio', () => {
    expect(SHIPS.heavy.cost.gold).toBe(SHIPS.scout.cost.gold * 10);
    expect(SHIPS.heavy.cost.manpower).toBe(SHIPS.scout.cost.manpower * 5);
  });
});

describe('building configuration', () => {
  it('defines every planet and moon building', () => {
    for (const type of [...PLANET_BUILDING_TYPES, ...MOON_BUILDING_TYPES]) {
      expect(BUILDINGS[type]).toBeDefined();
      expect(BUILDINGS[type].type).toBe(type);
    }
  });

  it('places planet buildings on planets and moon buildings on moons', () => {
    for (const type of PLANET_BUILDING_TYPES) {
      expect(BUILDINGS[type].site).toBe('planet');
    }
    for (const type of MOON_BUILDING_TYPES) {
      expect(BUILDINGS[type].site).toBe('moon');
    }
  });

  it('gives every factory a produces target and a 45 second base interval', () => {
    for (const definition of Object.values(BUILDINGS)) {
      if (definition.produces !== null) {
        expect(definition.productionInterval).toBe(45);
      }
    }
  });

  it('makes only the command center indestructible', () => {
    for (const definition of Object.values(BUILDINGS)) {
      expect(definition.isDestructible).toBe(definition.type !== 'commandCenter');
    }
  });

  it('reduces factory production interval with each upgrade', () => {
    expect(productionInterval('scoutFactory', 1, 0)).toBe(45);
    expect(productionInterval('scoutFactory', 2, 0)).toBe(35);
    expect(productionInterval('scoutFactory', 3, 0)).toBe(30);
  });

  it('applies the research lab production speed bonus', () => {
    expect(productionInterval('scoutFactory', 1, 0.1)).toBeCloseTo(45 / 1.1, 5);
  });

  it('scales gold mine output across all four levels', () => {
    expect(resourceOutput('goldMine', 1)).toBe(3);
    expect(resourceOutput('goldMine', 2)).toBe(5);
    expect(resourceOutput('goldMine', 3)).toBe(8);
    expect(resourceOutput('goldMine', 4)).toBe(12);
    expect(maxLevel('goldMine')).toBe(4);
  });

  it('returns null once a building is fully upgraded', () => {
    expect(nextUpgrade('goldMine', 4)).toBeNull();
    expect(nextUpgrade('goldMine', 1)?.level).toBe(2);
  });

  it('charges exotic resources only for the advanced factories', () => {
    expect(BUILDINGS.medicBay.cost.crystal).toBe(10);
    expect(BUILDINGS.bomberFacility.cost.gas).toBe(20);
    expect(BUILDINGS.sniperDock.cost.tungsten).toBe(15);
    expect(BUILDINGS.scoutFactory.cost.crystal).toBe(0);
  });
});

describe('map configuration', () => {
  it('lays out exactly seven planets to win', () => {
    expect(PLANETS).toHaveLength(PLANETS_TO_WIN);
  });

  it('spaces planets 3000 units apart over an 18000 unit chain', () => {
    for (let i = 1; i < PLANETS.length; i += 1) {
      const previous = PLANETS[i - 1];
      const current = PLANETS[i];
      expect(current!.x - previous!.x).toBe(PLANET_SPACING);
    }
    const first = PLANETS[0]!;
    const last = PLANETS[PLANETS.length - 1]!;
    expect(last.x - first.x).toBe(MAP_LENGTH);
    expect(MAP_LENGTH).toBe(18000);
  });

  it('keeps every planet inside the world bounds', () => {
    for (const planet of PLANETS) {
      expect(planet.x - planet.radius).toBeGreaterThan(0);
      expect(planet.x + planet.radius).toBeLessThan(WORLD_WIDTH);
    }
  });

  it('assigns capitals to the two ends and leaves the rest neutral', () => {
    expect(PLANETS[0]!.initialOwner).toBe(1);
    expect(PLANETS[6]!.initialOwner).toBe(2);
    for (let i = 1; i <= 5; i += 1) {
      expect(PLANETS[i]!.initialOwner).toBe(0);
    }
  });

  it('places one exotic resource on each of the three exotic planets', () => {
    const exotics = PLANETS.map((planet) => planet.exotic).filter((value) => value !== null);
    expect(exotics.sort()).toEqual(['crystal', 'gas', 'tungsten']);
  });

  it('gives every planet two or three moons with three slots each', () => {
    for (const planet of PLANETS) {
      expect(planet.moons.length).toBeGreaterThanOrEqual(2);
      expect(planet.moons.length).toBeLessThanOrEqual(3);
      for (const moon of planet.moons) {
        expect(moon.buildingSlots).toBe(3);
      }
    }
    expect(MOONS).toHaveLength(16);
  });

  it('orbits moons outside their planet surface', () => {
    for (const planet of PLANETS) {
      for (const moon of planet.moons) {
        expect(moon.orbitRadius).toBeGreaterThan(planet.radius + moon.radius);
      }
    }
  });
});

describe('damage resolution', () => {
  it('applies flat armour reduction', () => {
    expect(resolveDamage(100, 'bullet', 'light')).toBeCloseTo(95, 5);
    expect(resolveDamage(100, 'bullet', 'medium')).toBeCloseTo(80, 5);
    expect(resolveDamage(100, 'bullet', 'heavy')).toBeCloseTo(60, 5);
    expect(resolveDamage(100, 'bullet', 'fortified')).toBeCloseTo(35, 5);
  });

  it('gives flak a bonus against light armour', () => {
    expect(resolveDamage(100, 'flak', 'light')).toBeCloseTo(130 * 0.95, 5);
  });

  it('gives rockets a bonus against heavy and a penalty against light', () => {
    expect(resolveDamage(100, 'rocket', 'heavy')).toBeCloseTo(120 * 0.6, 5);
    expect(resolveDamage(100, 'rocket', 'light')).toBeCloseTo(90 * 0.95, 5);
  });

  it('never returns negative damage', () => {
    expect(resolveDamage(0, 'laser', 'fortified')).toBe(0);
  });
});

describe('capture balance', () => {
  it('guarantees a minimum contest duration', () => {
    const fastestFlipSeconds = CAPTURE_THRESHOLD / MAX_CAPTURE_RATE;
    expect(fastestFlipSeconds).toBeGreaterThanOrEqual(5);
  });
});
