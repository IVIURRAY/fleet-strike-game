/**
 * Ship entity construction.
 *
 * The design docs sketch a single `createScoutShip` using an object-oriented
 * API that bitECS does not provide. This is the data-driven equivalent: one
 * factory reads the ship definition from config so every class is built from
 * the same code path.
 */

import { addComponent, addEntity } from 'bitecs';
import type { PlayerId, ShipType, WeaponStats } from '@fleet-strike/types';
import { ARMOR_TYPES } from '@fleet-strike/types';
import { SHIPS, SHIP_TYPE_IDS, WEAPON_TYPE_IDS } from '@fleet-strike/config';

import {
  Active,
  CaptureContributor,
  Collider,
  Health,
  Owner,
  Position,
  Repairer,
  Rotation,
  ShipClass,
  ShipTag,
  Targeting,
  Velocity,
  WaypointFollower,
  Weapons,
  MAX_WEAPON_MOUNTS,
} from '../components';
import type { GameWorld } from '../world';

/** Optional per-spawn stat bonuses granted by factory upgrades. */
export interface ShipSpawnBonuses {
  readonly hpBonus: number;
  readonly damageBonus: number;
}

const NO_BONUSES: ShipSpawnBonuses = { hpBonus: 0, damageBonus: 0 };

/** Parameters for spawning a ship. */
export interface CreateShipParams {
  readonly type: ShipType;
  readonly owner: PlayerId;
  readonly x: number;
  readonly y: number;
  readonly rotation?: number;
  readonly waypointX: number;
  readonly waypointY: number;
  readonly bonuses?: ShipSpawnBonuses;
}

/**
 * Creates a ship entity and returns its id.
 *
 * @example
 * const scout = createShip(world, {
 *   type: 'scout', owner: 1, x: 100, y: 200, waypointX: 3000, waypointY: 3000,
 * });
 */
export function createShip(world: GameWorld, params: CreateShipParams): number {
  const definition = SHIPS[params.type];
  const bonuses = params.bonuses ?? NO_BONUSES;
  const entity = addEntity(world);

  addComponent(world, ShipTag, entity);
  addComponent(world, Active, entity);

  addComponent(world, Position, entity);
  Position.x[entity] = params.x;
  Position.y[entity] = params.y;

  addComponent(world, Velocity, entity);
  Velocity.dx[entity] = 0;
  Velocity.dy[entity] = 0;
  Velocity.maxSpeed[entity] = definition.maxSpeed;
  Velocity.minSpeed[entity] = definition.minSpeed;

  addComponent(world, Rotation, entity);
  Rotation.angle[entity] = params.rotation ?? 0;
  Rotation.turnRate[entity] = (definition.turnRate * Math.PI) / 180;

  addComponent(world, Collider, entity);
  Collider.radius[entity] = definition.hitboxRadius;

  addComponent(world, Owner, entity);
  Owner.playerId[entity] = params.owner;

  addComponent(world, ShipClass, entity);
  ShipClass.typeId[entity] = SHIP_TYPE_IDS[params.type];

  const maxHp = definition.maxHp + bonuses.hpBonus;
  addComponent(world, Health, entity);
  Health.current[entity] = maxHp;
  Health.max[entity] = maxHp;
  Health.armorId[entity] = ARMOR_TYPES.indexOf(definition.armor);
  Health.timeSinceDamage[entity] = 0;

  addComponent(world, Weapons, entity);
  applyWeapons(entity, definition.weapons, bonuses.damageBonus);

  addComponent(world, Targeting, entity);
  Targeting.target[entity] = 0;
  Targeting.detectionRange[entity] = definition.detectionRange;
  // Stagger the first evaluation so a spawned wave does not retarget in lockstep.
  Targeting.cooldown[entity] = world.context.random() * 0.5;

  addComponent(world, WaypointFollower, entity);
  WaypointFollower.targetX[entity] = params.waypointX;
  WaypointFollower.targetY[entity] = params.waypointY;
  WaypointFollower.arrived[entity] = 0;
  WaypointFollower.loiterPhase[entity] = world.context.random() * Math.PI * 2;

  addComponent(world, CaptureContributor, entity);
  CaptureContributor.rate[entity] = definition.captureRate;

  if (definition.repairPerSecond > 0) {
    addComponent(world, Repairer, entity);
    Repairer.perSecond[entity] = definition.repairPerSecond;
    Repairer.targets[entity] = definition.repairTargets;
    Repairer.range[entity] = definition.repairRange;
  }

  return entity;
}

/** Writes weapon mount data into the `Weapons` component arrays. */
function applyWeapons(entity: number, weapons: readonly WeaponStats[], damageBonus: number): void {
  const count = Math.min(weapons.length, MAX_WEAPON_MOUNTS);
  Weapons.count[entity] = count;

  for (let i = 0; i < count; i += 1) {
    const weapon = weapons[i];
    if (weapon === undefined) continue;
    Weapons.weaponId[entity]![i] = WEAPON_TYPE_IDS[weapon.weaponType];
    Weapons.damage[entity]![i] = weapon.damage + damageBonus;
    Weapons.rateOfFire[entity]![i] = weapon.rateOfFire;
    Weapons.range[entity]![i] = weapon.range;
    Weapons.projectileSpeed[entity]![i] = weapon.projectileSpeed;
    Weapons.areaOfEffect[entity]![i] = weapon.areaOfEffect;
    Weapons.chargeTime[entity]![i] = weapon.chargeTime;
    Weapons.cooldown[entity]![i] = weapon.chargeTime;
  }
}
