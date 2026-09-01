/**
 * Health system — reaps destroyed entities.
 *
 * Destruction is deferred to the end of the tick so a ship that dies mid-tick
 * is still a valid target for anything already resolving against it, avoiding
 * order-dependent behaviour between systems.
 */

import { hasComponent, removeComponent } from 'bitecs';
import type { PlayerId } from '@fleet-strike/types';
import { REFUND_MANPOWER_ON_DEATH, SHIPS, SHIP_TYPE_BY_ID } from '@fleet-strike/config';
import { refundManpower } from '@fleet-strike/utils';

import {
  Active,
  BuildingTag,
  Collider,
  Health,
  Owner,
  Position,
  ShipClass,
  ShipTag,
} from '../components';
import { damageableQuery } from '../queries';
import { emitEvent } from '../world';
import type { GameWorld } from '../world';

/** Flags entities at zero HP for removal and emits destruction events. */
export function healthSystem(world: GameWorld): void {
  const entities = damageableQuery(world);
  const { pendingRemoval } = world.context;

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    if ((Health.current[eid] as number) > 0) continue;
    pendingRemoval.push(eid);
  }
}

/**
 * Applies queued removals. Runs last in the tick.
 *
 * Ships refund their manpower to the owning player, which the docs describe as
 * a deliberate comeback mechanic.
 */
export function removalSystem(world: GameWorld): void {
  const { pendingRemoval, players } = world.context;
  if (pendingRemoval.length === 0) return;

  for (let i = 0; i < pendingRemoval.length; i += 1) {
    const eid = pendingRemoval[i] as number;
    if (!hasComponent(world, Active, eid)) continue;

    const owner = Owner.playerId[eid] as PlayerId;
    const isShip = hasComponent(world, ShipTag, eid);

    emitEvent(world, {
      type: 'ENTITY_DESTROYED',
      entityId: eid,
      x: Position.x[eid] as number,
      y: Position.y[eid] as number,
      scale: hasComponent(world, Collider, eid) ? (Collider.radius[eid] as number) / 8 : 1,
    });

    if (isShip) {
      const player = players.get(owner);
      if (player !== undefined) {
        player.stats.shipsLost += 1;
        if (REFUND_MANPOWER_ON_DEATH) {
          const typeId = ShipClass.typeId[eid] as number;
          const shipType = SHIP_TYPE_BY_ID[typeId];
          if (shipType !== undefined) {
            refundManpower(player.resources, SHIPS[shipType].cost.manpower, player.caps);
          }
        }
      }
      creditKill(world, owner);
    } else if (hasComponent(world, BuildingTag, eid)) {
      const player = players.get(owner);
      if (player !== undefined) {
        // Losing a structure frees the power it was drawing.
        player.stats.buildingsConstructed = Math.max(0, player.stats.buildingsConstructed);
      }
    }

    // Deactivating rather than deleting keeps entity ids stable for the client.
    removeComponent(world, Active, eid);
  }

  pendingRemoval.length = 0;
}

/** Credits the opposing player with a kill. */
function creditKill(world: GameWorld, victimOwner: PlayerId): void {
  const killer = victimOwner === 1 ? 2 : 1;
  const player = world.context.players.get(killer);
  if (player !== undefined) {
    player.stats.shipsKilled += 1;
  }
}
