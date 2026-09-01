/**
 * Combined building registry and lookup helpers.
 */

import type {
  BuildingDefinition,
  BuildingType,
  BuildingUpgrade,
  MoonBuildingType,
  PlanetBuildingType,
  ResourceCost,
} from '@fleet-strike/types';
import { MOON_BUILDING_TYPES, PLANET_BUILDING_TYPES } from '@fleet-strike/types';

import { MOON_BUILDINGS } from './buildings-moon';
import { PLANET_BUILDINGS } from './buildings-planet';
import { scaleCost } from './cost';

export { MOON_BUILDINGS } from './buildings-moon';
export { PLANET_BUILDINGS, RESEARCH_LAB_BASE_DISCOUNT } from './buildings-planet';

/** Every building keyed by type. */
export const BUILDINGS: Readonly<Record<BuildingType, BuildingDefinition>> = {
  ...PLANET_BUILDINGS,
  ...MOON_BUILDINGS,
};

/** Buildings a player may construct on a planet surface, excluding pre-placed ones. */
export const BUILDABLE_PLANET_TYPES: readonly PlanetBuildingType[] = PLANET_BUILDING_TYPES.filter(
  (type) => type !== 'commandCenter'
);

/** Buildings a player may construct on a moon slot. */
export const BUILDABLE_MOON_TYPES: readonly MoonBuildingType[] = MOON_BUILDING_TYPES;

/** True when `type` names a planet building. */
export function isPlanetBuilding(type: BuildingType): type is PlanetBuildingType {
  return BUILDINGS[type].site === 'planet';
}

/** True when `type` names a moon building. */
export function isMoonBuilding(type: BuildingType): type is MoonBuildingType {
  return BUILDINGS[type].site === 'moon';
}

/** Highest level a building can reach. */
export function maxLevel(type: BuildingType): number {
  const { upgrades } = BUILDINGS[type];
  return upgrades.length === 0 ? 1 : (upgrades[upgrades.length - 1]?.level ?? 1);
}

/** The upgrade that takes a building from `currentLevel` to the next level. */
export function nextUpgrade(type: BuildingType, currentLevel: number): BuildingUpgrade | null {
  return BUILDINGS[type].upgrades.find((upgrade) => upgrade.level === currentLevel + 1) ?? null;
}

/** Applies a player's Research Lab discount to an upgrade price. */
export function discountedUpgradeCost(base: ResourceCost, discount: number): ResourceCost {
  const clamped = discount < 0 ? 0 : discount > 0.9 ? 0.9 : discount;
  return scaleCost(base, 1 - clamped);
}

/**
 * Effective production interval for a factory, accounting for its level and
 * the owner's cumulative Research Lab speed bonus.
 */
export function productionInterval(
  type: BuildingType,
  level: number,
  productionSpeedBonus: number
): number {
  const definition = BUILDINGS[type];
  let interval = definition.productionInterval;
  for (const upgrade of definition.upgrades) {
    if (upgrade.level <= level && upgrade.productionInterval !== undefined) {
      interval = upgrade.productionInterval;
    }
  }
  return interval / (1 + productionSpeedBonus);
}

/** Cumulative HP bonus applied to units produced by a factory at `level`. */
export function unitHpBonus(type: BuildingType, level: number): number {
  let bonus = 0;
  for (const upgrade of BUILDINGS[type].upgrades) {
    if (upgrade.level <= level && upgrade.unitHpBonus !== undefined) {
      bonus = upgrade.unitHpBonus;
    }
  }
  return bonus;
}

/** Cumulative per-shot damage bonus applied to units produced at `level`. */
export function unitDamageBonus(type: BuildingType, level: number): number {
  let bonus = 0;
  for (const upgrade of BUILDINGS[type].upgrades) {
    if (upgrade.level <= level && upgrade.unitDamageBonus !== undefined) {
      bonus = upgrade.unitDamageBonus;
    }
  }
  return bonus;
}

/** Resource output per second for an economy building at `level`. */
export function resourceOutput(type: BuildingType, level: number): number {
  const definition = BUILDINGS[type];
  if (definition.generates === null) return 0;
  let amount = definition.generates.amount;
  for (const upgrade of definition.upgrades) {
    if (upgrade.level <= level && upgrade.resourcePerSecond !== undefined) {
      amount = upgrade.resourcePerSecond;
    }
  }
  return amount;
}

/** Power capacity contributed by a power plant at `level`. */
export function powerCapacity(type: BuildingType, level: number): number {
  const definition = BUILDINGS[type];
  let capacity = definition.powerCapacity;
  for (const upgrade of definition.upgrades) {
    if (upgrade.level <= level && upgrade.powerCapacity !== undefined) {
      capacity = upgrade.powerCapacity;
    }
  }
  return capacity;
}

/** Manpower cap contributed by a manpower centre at `level`. */
export function manpowerCapBonus(type: BuildingType, level: number): number {
  const definition = BUILDINGS[type];
  let bonus = definition.manpowerCapBonus;
  for (const upgrade of definition.upgrades) {
    if (upgrade.level <= level && upgrade.manpowerCapBonus !== undefined) {
      bonus = upgrade.manpowerCapBonus;
    }
  }
  return bonus;
}

/** Maximum HP of a building at `level`, including upgrade bonuses. */
export function buildingMaxHp(type: BuildingType, level: number): number {
  const definition = BUILDINGS[type];
  let hp = definition.maxHp;
  for (const upgrade of definition.upgrades) {
    if (upgrade.level <= level && upgrade.hpBonus !== undefined) {
      hp = definition.maxHp + upgrade.hpBonus;
    }
  }
  return hp;
}
