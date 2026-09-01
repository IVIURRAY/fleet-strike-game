/**
 * Lifetime system — expires temporary entities.
 *
 * Projectiles are recycled into their pool rather than deactivated outright, so
 * long-running matches do not grow the entity table without bound.
 */

import { hasComponent } from 'bitecs';

import { Lifetime, ProjectileTag } from '../components';
import { lifetimeQuery } from '../queries';
import { recycleProjectile } from '../entities/projectile';
import { scheduleRemoval } from '../world';
import type { GameWorld } from '../world';

/** Counts down every lifetime and expires those that reach zero. */
export function lifetimeSystem(world: GameWorld, deltaTime: number): void {
  const entities = lifetimeQuery(world);

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;
    const remaining = (Lifetime.remaining[eid] as number) - deltaTime;

    if (remaining > 0) {
      Lifetime.remaining[eid] = remaining;
      continue;
    }

    if (hasComponent(world, ProjectileTag, eid)) {
      recycleProjectile(world, eid);
    } else {
      scheduleRemoval(world, eid);
    }
  }
}
