/**
 * Building domain types: factories, economy buildings and moon defences.
 *
 * Source: docs/Complete_Units_and_Buildings.md ("Planet Buildings", "Moon
 * Buildings"), docs/ResourcesEconomy.md
 */

import type { BasicResource, ResourceCost } from './resources';
import type { ArmorType, WeaponStats } from './combat';
import type { ShipType } from './ships';

/** Buildings that occupy a planet's build slots. */
export const PLANET_BUILDING_TYPES = [
  'commandCenter',
  'scoutFactory',
  'soldierFactory',
  'heavyFactory',
  'medicBay',
  'engineerWorkshop',
  'bomberFacility',
  'sniperDock',
  'goldMine',
  'manpowerCenter',
  'powerPlant',
  'researchLab',
] as const;
export type PlanetBuildingType = (typeof PLANET_BUILDING_TYPES)[number];

/** Buildings that occupy one of a moon's three slots. */
export const MOON_BUILDING_TYPES = [
  'plasmaTurret',
  'flakBattery',
  'laserArray',
  'shieldGenerator',
  'radarStation',
  'missileSilo',
  'repairStation',
] as const;
export type MoonBuildingType = (typeof MOON_BUILDING_TYPES)[number];

export const BUILDING_TYPES = [...PLANET_BUILDING_TYPES, ...MOON_BUILDING_TYPES] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

/** Where a building may be placed. */
export type BuildSite = 'planet' | 'moon';

/** One upgrade step for a building. */
export interface BuildingUpgrade {
  /** Resulting level, 2 or higher. */
  readonly level: number;
  readonly cost: ResourceCost;
  /** Seconds between unit spawns after this upgrade, for factories. */
  readonly productionInterval?: number;
  /** Flat HP added to units produced after this upgrade. */
  readonly unitHpBonus?: number;
  /** Flat damage added per shot to units produced after this upgrade. */
  readonly unitDamageBonus?: number;
  /** Absolute resource output per second after this upgrade. */
  readonly resourcePerSecond?: number;
  /** Absolute power capacity after this upgrade. */
  readonly powerCapacity?: number;
  /** Absolute manpower cap increase after this upgrade. */
  readonly manpowerCapBonus?: number;
  /** Fractional discount applied to all other upgrades, e.g. 0.25 for -25%. */
  readonly upgradeDiscount?: number;
  /** Fractional speed-up applied to all factories, e.g. 0.1 for +10%. */
  readonly productionSpeedBonus?: number;
  /** Flat additions to the building's own weapon. */
  readonly hpBonus?: number;
  readonly damageBonus?: number;
  readonly rangeBonus?: number;
}

/** Static definition of a building type. */
export interface BuildingDefinition {
  readonly type: BuildingType;
  readonly name: string;
  readonly nickname: string;
  readonly site: BuildSite;
  readonly cost: ResourceCost;
  /** Seconds to construct. */
  readonly buildTime: number;
  /** Power drawn from the parent planet's budget. */
  readonly power: number;
  readonly maxHp: number;
  readonly armor: ArmorType;
  /** Ship produced by this factory, if it is a factory. */
  readonly produces: ShipType | null;
  /** Seconds between spawns at level 1. */
  readonly productionInterval: number;
  /** Continuous resource output at level 1. */
  readonly generates: { readonly resource: BasicResource; readonly amount: number } | null;
  /** Power capacity contributed at level 1 (power plants only). */
  readonly powerCapacity: number;
  /** Manpower cap contributed at level 1 (manpower centres only). */
  readonly manpowerCapBonus: number;
  /** Defensive weapon, for turrets. */
  readonly weapon: WeaponStats | null;
  /** Radius of a passive support aura in world units, `0` if none. */
  readonly auraRadius: number;
  /** HP restored per second per ally inside `auraRadius`. */
  readonly repairPerSecond: number;
  /** Shield pool projected over `auraRadius`. */
  readonly shieldHp: number;
  /** Shield regeneration per second after `shieldRegenDelay`. */
  readonly shieldRegen: number;
  /** Seconds without damage before shields regenerate. */
  readonly shieldRegenDelay: number;
  /** Vision radius granted, `0` if none. */
  readonly visionRadius: number;
  /** Whether the structure can be destroyed by weapons. */
  readonly isDestructible: boolean;
  readonly upgrades: readonly BuildingUpgrade[];
  readonly texture: string;
}

/** Live building state broadcast to clients. */
export interface BuildingState {
  readonly id: number;
  readonly type: BuildingType;
  readonly owner: 1 | 2;
  readonly x: number;
  readonly y: number;
  readonly level: number;
  readonly hp: number;
  readonly maxHp: number;
  /** Construction progress in [0, 1]. `1` means operational. */
  readonly buildProgress: number;
  /** Seconds until the next unit spawns, for factories. */
  readonly productionRemaining: number;
  /** True when production is blocked by insufficient resources. */
  readonly isStalled: boolean;
}
