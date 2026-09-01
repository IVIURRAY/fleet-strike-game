/**
 * Building entity construction.
 */

import { addComponent, addEntity } from 'bitecs';
import type { BuildingType, PlayerId } from '@fleet-strike/types';
import { ARMOR_TYPES, BUILDING_TYPES, RESOURCES } from '@fleet-strike/types';
import {
  BUILDINGS,
  WEAPON_TYPE_IDS,
  buildingMaxHp,
  manpowerCapBonus,
  powerCapacity,
  productionInterval,
  resourceOutput,
} from '@fleet-strike/config';
import { SHIP_TYPE_IDS } from '@fleet-strike/config';

import {
  Active,
  BuildingClass,
  BuildingTag,
  Collider,
  Health,
  Owner,
  Parent,
  PlanetRef,
  Position,
  Production,
  ResourceGenerator,
  Shield,
  SupportAura,
  Targeting,
  UnderConstruction,
  Vision,
  Weapons,
} from '../components';
import type { GameWorld } from '../world';

/** Parameters for constructing a building. */
export interface CreateBuildingParams {
  readonly type: BuildingType;
  readonly owner: PlayerId;
  readonly x: number;
  readonly y: number;
  /** Chain index of the planet this building belongs to. */
  readonly planetIndex: number;
  /** Planet or moon entity this building sits on. */
  readonly parentEntity: number;
  readonly level?: number;
  /** Multiplier applied to resource output, e.g. 1.5 on the Gold Planet. */
  readonly incomeMultiplier?: number;
  /** Fractional factory speed bonus from the owner's Research Labs. */
  readonly productionSpeedBonus?: number;
  /** When true the building starts operational instead of under construction. */
  readonly instant?: boolean;
}

/** Radius used for building collision and click targeting. */
const BUILDING_RADIUS = 26;

/** Creates a building entity and returns its id. */
export function createBuilding(world: GameWorld, params: CreateBuildingParams): number {
  const definition = BUILDINGS[params.type];
  const level = params.level ?? 1;
  const entity = addEntity(world);

  addComponent(world, BuildingTag, entity);
  addComponent(world, Active, entity);

  addComponent(world, Position, entity);
  Position.x[entity] = params.x;
  Position.y[entity] = params.y;

  addComponent(world, Collider, entity);
  Collider.radius[entity] = BUILDING_RADIUS;

  addComponent(world, Owner, entity);
  Owner.playerId[entity] = params.owner;

  addComponent(world, BuildingClass, entity);
  BuildingClass.typeId[entity] = BUILDING_TYPES.indexOf(params.type);
  BuildingClass.level[entity] = level;

  addComponent(world, PlanetRef, entity);
  PlanetRef.index[entity] = params.planetIndex;

  addComponent(world, Parent, entity);
  Parent.entity[entity] = params.parentEntity;

  const maxHp = buildingMaxHp(params.type, level);
  addComponent(world, Health, entity);
  Health.current[entity] = maxHp;
  Health.max[entity] = maxHp;
  Health.armorId[entity] = ARMOR_TYPES.indexOf(definition.armor);
  Health.timeSinceDamage[entity] = 0;

  if (!params.instant && definition.buildTime > 0) {
    addComponent(world, UnderConstruction, entity);
    UnderConstruction.remaining[entity] = definition.buildTime;
    UnderConstruction.total[entity] = definition.buildTime;
  }

  if (definition.produces !== null) {
    addComponent(world, Production, entity);
    const interval = productionInterval(params.type, level, params.productionSpeedBonus ?? 0);
    Production.shipTypeId[entity] = SHIP_TYPE_IDS[definition.produces];
    Production.interval[entity] = interval;
    Production.remaining[entity] = interval;
    Production.active[entity] = 1;
    Production.stalled[entity] = 0;
  }

  if (definition.generates !== null) {
    addComponent(world, ResourceGenerator, entity);
    ResourceGenerator.resourceId[entity] = RESOURCES.indexOf(definition.generates.resource);
    ResourceGenerator.perSecond[entity] = resourceOutput(params.type, level);
    ResourceGenerator.multiplier[entity] = params.incomeMultiplier ?? 1;
  }

  if (definition.weapon !== null) {
    const weapon = definition.weapon;
    addComponent(world, Weapons, entity);
    Weapons.count[entity] = 1;
    Weapons.weaponId[entity]![0] = WEAPON_TYPE_IDS[weapon.weaponType];
    Weapons.damage[entity]![0] = weapon.damage;
    Weapons.rateOfFire[entity]![0] = weapon.rateOfFire;
    Weapons.range[entity]![0] = weapon.range;
    Weapons.projectileSpeed[entity]![0] = weapon.projectileSpeed;
    Weapons.areaOfEffect[entity]![0] = weapon.areaOfEffect;
    Weapons.chargeTime[entity]![0] = weapon.chargeTime;
    Weapons.cooldown[entity]![0] = weapon.chargeTime;

    addComponent(world, Targeting, entity);
    Targeting.target[entity] = 0;
    Targeting.detectionRange[entity] = weapon.range;
    Targeting.cooldown[entity] = world.context.random() * 0.5;
  }

  if (definition.auraRadius > 0) {
    addComponent(world, SupportAura, entity);
    SupportAura.radius[entity] = definition.auraRadius;
    SupportAura.repairPerSecond[entity] = definition.repairPerSecond;
  }

  if (definition.shieldHp > 0) {
    addComponent(world, Shield, entity);
    Shield.current[entity] = definition.shieldHp;
    Shield.max[entity] = definition.shieldHp;
    Shield.regenRate[entity] = definition.shieldRegen;
    Shield.regenDelay[entity] = definition.shieldRegenDelay;
  }

  if (definition.visionRadius > 0) {
    addComponent(world, Vision, entity);
    Vision.radius[entity] = definition.visionRadius;
  }

  return entity;
}

/** Power capacity a completed building contributes. */
export function buildingPowerCapacity(type: BuildingType, level: number): number {
  return powerCapacity(type, level);
}

/** Manpower cap a completed building contributes. */
export function buildingManpowerCap(type: BuildingType, level: number): number {
  return manpowerCapBonus(type, level);
}
