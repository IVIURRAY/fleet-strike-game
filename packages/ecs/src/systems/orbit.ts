/**
 * Moon orbit system.
 *
 * Cheap by design — there are only 16 moons — but it must run before turret
 * targeting so a moon's weapons fire from the moon's current position.
 */

import { Orbital, Position } from '../components';
import { orbitalQuery } from '../queries';
import type { GameWorld } from '../world';

/** Advances every moon along its orbit. */
export function moonOrbitSystem(world: GameWorld, deltaTime: number): void {
  const entities = orbitalQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const parent = Orbital.parent[eid] as number;

    const angle = (Orbital.angle[eid] as number) + (Orbital.speed[eid] as number) * deltaTime;
    Orbital.angle[eid] = angle;

    const radius = Orbital.radius[eid] as number;
    Position.x[eid] = (Position.x[parent] as number) + Math.cos(angle) * radius;
    Position.y[eid] = (Position.y[parent] as number) + Math.sin(angle) * radius;
  }
}
