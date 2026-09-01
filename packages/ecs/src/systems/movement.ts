/**
 * Movement system — integrates velocity into position.
 *
 * Runs first in the pipeline and is the most expensive system in the game, so
 * it does nothing but the integration itself and a world-bounds clamp.
 */

import { WORLD_HEIGHT, WORLD_WIDTH } from '@fleet-strike/config';

import { Position, Velocity } from '../components';
import { projectileQuery, shipQuery } from '../queries';
import type { GameWorld } from '../world';

/** Advances every ship and projectile by `deltaTime` seconds. */
export function movementSystem(world: GameWorld, deltaTime: number): void {
  integrate(shipQuery(world), deltaTime, true);
  // Projectiles are allowed to leave the map; they expire on their own.
  integrate(projectileQuery(world), deltaTime, false);
}

function integrate(entities: readonly number[], deltaTime: number, clampToWorld: boolean): void {
  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;

    let x = (Position.x[eid] as number) + (Velocity.dx[eid] as number) * deltaTime;
    let y = (Position.y[eid] as number) + (Velocity.dy[eid] as number) * deltaTime;

    if (clampToWorld) {
      if (x < 0) x = 0;
      else if (x > WORLD_WIDTH) x = WORLD_WIDTH;
      if (y < 0) y = 0;
      else if (y > WORLD_HEIGHT) y = WORLD_HEIGHT;
    }

    Position.x[eid] = x;
    Position.y[eid] = y;
  }
}
