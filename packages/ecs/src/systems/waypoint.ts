/**
 * Waypoint navigation — steers ships toward their owner's rally point.
 *
 * Behaviour follows docs/MVP_Design.md: ships move toward the waypoint and,
 * once there, keep flying around it rather than stopping dead. Ships never
 * fully halt, which is why `minSpeed` is enforced.
 *
 * A separation force is added so a fleet of 200 ships does not collapse into a
 * single pixel — the docs call for ships to "continue moving, spinning, flying
 * around the point" while maintaining cohesion.
 */

import {
  SHIP_SEPARATION_RADIUS,
  SHIP_SEPARATION_STRENGTH,
  WAYPOINT_LOITER_RADIUS,
} from '@fleet-strike/config';
import { distanceSquared, rotateToward } from '@fleet-strike/utils';

import { Collider, Position, Rotation, Velocity, WaypointFollower } from '../components';
import { waypointQuery } from '../queries';
import type { GameWorld } from '../world';

/** Steers every ship toward its waypoint, respecting turn rate and speed. */
export function waypointNavigationSystem(world: GameWorld, deltaTime: number): void {
  const entities = waypointQuery(world);
  const { shipGrid } = world.context;

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;

    const x = Position.x[eid] as number;
    const y = Position.y[eid] as number;
    const targetX = WaypointFollower.targetX[eid] as number;
    const targetY = WaypointFollower.targetY[eid] as number;

    const toTargetX = targetX - x;
    const toTargetY = targetY - y;
    const distanceToTarget = Math.sqrt(toTargetX * toTargetX + toTargetY * toTargetY);

    const arrived = distanceToTarget <= WAYPOINT_LOITER_RADIUS;
    WaypointFollower.arrived[eid] = arrived ? 1 : 0;

    let desiredX: number;
    let desiredY: number;

    if (arrived) {
      // Orbit the waypoint. Each ship has its own phase so the fleet spreads
      // into a ring instead of stacking.
      const phase = (WaypointFollower.loiterPhase[eid] as number) + deltaTime;
      WaypointFollower.loiterPhase[eid] = phase;
      const orbitX = targetX + Math.cos(phase) * WAYPOINT_LOITER_RADIUS * 0.7;
      const orbitY = targetY + Math.sin(phase) * WAYPOINT_LOITER_RADIUS * 0.7;
      desiredX = orbitX - x;
      desiredY = orbitY - y;
    } else {
      desiredX = toTargetX;
      desiredY = toTargetY;
    }

    const separation = computeSeparation(eid, x, y, shipGrid);
    desiredX += separation.x;
    desiredY += separation.y;

    const desiredLength = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
    if (desiredLength < 1e-6) continue;

    // Turn toward the desired heading at no more than the ship's turn rate.
    const desiredAngle = Math.atan2(desiredY, desiredX);
    const turnStep = (Rotation.turnRate[eid] as number) * deltaTime;
    const angle = rotateToward(Rotation.angle[eid] as number, desiredAngle, turnStep);
    Rotation.angle[eid] = angle;

    // Ships accelerate to full speed when travelling and ease off when
    // loitering, but never drop below their minimum speed.
    const maxSpeed = Velocity.maxSpeed[eid] as number;
    const minSpeed = Velocity.minSpeed[eid] as number;
    const speed = arrived ? minSpeed + (maxSpeed - minSpeed) * 0.35 : maxSpeed;

    Velocity.dx[eid] = Math.cos(angle) * speed;
    Velocity.dy[eid] = Math.sin(angle) * speed;
  }
}

/** Reused so the separation calculation allocates nothing per ship. */
const separationResult = { x: 0, y: 0 };

/** Sums a repulsion vector away from nearby ships. */
function computeSeparation(
  eid: number,
  x: number,
  y: number,
  grid: { query(x: number, y: number, radius: number): readonly number[] }
): { x: number; y: number } {
  separationResult.x = 0;
  separationResult.y = 0;

  const radius = SHIP_SEPARATION_RADIUS + (Collider.radius[eid] as number);
  const neighbours = grid.query(x, y, radius);
  const radiusSquared = radius * radius;

  for (let i = 0; i < neighbours.length; i += 1) {
    const other = neighbours[i] as number;
    if (other === eid) continue;

    const ox = Position.x[other] as number;
    const oy = Position.y[other] as number;
    const dSquared = distanceSquared(x, y, ox, oy);
    if (dSquared >= radiusSquared) continue;

    if (dSquared < 1e-6) {
      // Perfectly co-located: push apart along a deterministic pseudo-random
      // direction derived from the entity ids so the simulation stays
      // reproducible.
      const angle = ((eid * 2654435761 + other) % 628) / 100;
      separationResult.x += Math.cos(angle) * SHIP_SEPARATION_STRENGTH;
      separationResult.y += Math.sin(angle) * SHIP_SEPARATION_STRENGTH;
      continue;
    }

    const d = Math.sqrt(dSquared);
    const push = ((radius - d) / radius) * SHIP_SEPARATION_STRENGTH;
    separationResult.x += ((x - ox) / d) * push;
    separationResult.y += ((y - oy) / d) * push;
  }

  return separationResult;
}
