/**
 * Construction and production systems.
 *
 * Construction and production are separate timers: a factory first spends its
 * build time being erected, and only then starts its 45-second production
 * cycle. The docs list both a per-ship "build time" of 45s and a per-factory
 * interval of 45s without saying how they combine; treating the factory
 * interval as authoritative avoids double-charging 90 seconds per ship.
 */

import { hasComponent, removeComponent } from 'bitecs';
import type { BuildingType, PlayerId, ShipType } from '@fleet-strike/types';
import { BUILDING_TYPES } from '@fleet-strike/types';
import { SHIPS, SHIP_TYPE_BY_ID } from '@fleet-strike/config';
import { productionInterval, unitDamageBonus, unitHpBonus } from '@fleet-strike/config';
import { hasResources, spend } from '@fleet-strike/utils';

import {
  BuildingClass,
  Owner,
  Position,
  Production,
  UnderConstruction,
} from '../components';
import { constructionQuery, productionQuery } from '../queries';
import { createShip } from '../entities/ship';
import { emitEvent } from '../world';
import type { GameWorld } from '../world';

/** Advances build timers and brings finished structures online. */
export function constructionSystem(world: GameWorld, deltaTime: number): void {
  const entities = constructionQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const remaining = (UnderConstruction.remaining[eid] as number) - deltaTime;

    if (remaining > 0) {
      UnderConstruction.remaining[eid] = remaining;
      continue;
    }

    removeComponent(world, UnderConstruction, eid);

    const typeId = BuildingClass.typeId[eid] as number;
    const buildingType = BUILDING_TYPES[typeId];
    if (buildingType === undefined) continue;

    emitEvent(world, {
      type: 'BUILDING_COMPLETED',
      buildingId: eid,
      buildingType,
      owner: Owner.playerId[eid] as PlayerId,
    });
  }
}

/**
 * Spawns units from factories.
 *
 * A factory that cannot pay for its unit enters a stalled state rather than
 * silently skipping the cycle, so the HUD can explain why nothing is appearing.
 */
export function productionSystem(world: GameWorld, deltaTime: number): void {
  const entities = productionQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;

    // Structures still being built, or on a planet lost to the enemy, are idle.
    if (hasComponent(world, UnderConstruction, eid)) continue;
    if ((Production.active[eid] as number) === 0) continue;

    const remaining = (Production.remaining[eid] as number) - deltaTime;
    if (remaining > 0) {
      Production.remaining[eid] = remaining;
      Production.stalled[eid] = 0;
      continue;
    }

    const owner = Owner.playerId[eid] as PlayerId;
    const player = world.context.players.get(owner);
    if (player === undefined) continue;

    const shipType = SHIP_TYPE_BY_ID[Production.shipTypeId[eid] as number];
    if (shipType === undefined) continue;

    const price = SHIPS[shipType].cost;
    if (!hasResources(player.resources, price)) {
      // Hold at zero and retry next tick; the docs call for a visible stall.
      Production.remaining[eid] = 0;
      Production.stalled[eid] = 1;
      continue;
    }

    spend(player.resources, price);
    Production.stalled[eid] = 0;
    spawnFromFactory(world, eid, shipType, owner);

    const buildingType = BUILDING_TYPES[BuildingClass.typeId[eid] as number];
    const level = BuildingClass.level[eid] as number;
    const interval =
      buildingType === undefined
        ? (Production.interval[eid] as number)
        : productionInterval(buildingType, level, player.productionSpeedBonus);
    Production.interval[eid] = interval;
    Production.remaining[eid] = interval;
  }
}

/** Creates the unit and emits the spawn event. */
function spawnFromFactory(
  world: GameWorld,
  factory: number,
  shipType: ShipType,
  owner: PlayerId
): void {
  const player = world.context.players.get(owner);
  if (player === undefined) return;

  const buildingType = BUILDING_TYPES[BuildingClass.typeId[factory] as number] as
    | BuildingType
    | undefined;
  const level = BuildingClass.level[factory] as number;

  const bonuses =
    buildingType === undefined
      ? { hpBonus: 0, damageBonus: 0 }
      : {
          hpBonus: unitHpBonus(buildingType, level),
          damageBonus: unitDamageBonus(buildingType, level),
        };

  // Spawn just off the factory so new ships do not appear inside each other.
  const angle = world.context.random() * Math.PI * 2;
  const offset = 60;
  const x = (Position.x[factory] as number) + Math.cos(angle) * offset;
  const y = (Position.y[factory] as number) + Math.sin(angle) * offset;

  const entity = createShip(world, {
    type: shipType,
    owner,
    x,
    y,
    rotation: angle,
    waypointX: player.waypoint.x,
    waypointY: player.waypoint.y,
    bonuses,
  });

  player.stats.shipsProduced += 1;

  emitEvent(world, {
    type: 'SHIP_SPAWNED',
    entityId: entity,
    shipType,
    owner,
    x,
    y,
  });
}
