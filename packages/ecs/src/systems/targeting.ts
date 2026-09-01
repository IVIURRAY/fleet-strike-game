/**
 * Targeting system — acquires the nearest enemy.
 *
 * MVP targeting is deliberately simple (docs/MVP_Design.md: "Nearest enemy,
 * no complex priorities"). Re-evaluation happens every TARGETING_INTERVAL
 * seconds rather than every tick, and uses the spatial index so the cost is
 * O(n) rather than O(n^2).
 */

import { TARGETING_INTERVAL } from '@fleet-strike/config';
import { distanceSquared } from '@fleet-strike/utils';

import { Active, Health, Owner, Position, Targeting } from '../components';
import { targetingQuery } from '../queries';
import { hasComponent } from 'bitecs';
import type { GameWorld } from '../world';

/** Assigns each armed entity its nearest enemy within detection range. */
export function targetingSystem(world: GameWorld, deltaTime: number): void {
  const entities = targetingQuery(world);
  const { shipGrid, structureGrid } = world.context;

  for (let i = 0; i < entities.length; i += 1) {
    const eid = entities[i] as number;

    const cooldown = (Targeting.cooldown[eid] as number) - deltaTime;
    if (cooldown > 0 && isTargetStillValid(world, eid)) {
      Targeting.cooldown[eid] = cooldown;
      continue;
    }
    Targeting.cooldown[eid] = TARGETING_INTERVAL;

    const x = Position.x[eid] as number;
    const y = Position.y[eid] as number;
    const range = Targeting.detectionRange[eid] as number;
    const owner = Owner.playerId[eid] as number;

    let best = 0;
    let bestDistance = range * range;

    // Ships first — they are the primary threat and the more numerous target.
    const ships = shipGrid.query(x, y, range);
    for (let j = 0; j < ships.length; j += 1) {
      const candidate = ships[j] as number;
      if ((Owner.playerId[candidate] as number) === owner) continue;
      const d = distanceSquared(
        x,
        y,
        Position.x[candidate] as number,
        Position.y[candidate] as number
      );
      if (d < bestDistance) {
        bestDistance = d;
        best = candidate;
      }
    }

    // Fall back to structures only when no enemy ship is in range, so fleets
    // defend themselves before sieging.
    if (best === 0) {
      const structures = structureGrid.query(x, y, range);
      for (let j = 0; j < structures.length; j += 1) {
        const candidate = structures[j] as number;
        if ((Owner.playerId[candidate] as number) === owner) continue;
        const d = distanceSquared(
          x,
          y,
          Position.x[candidate] as number,
          Position.y[candidate] as number
        );
        if (d < bestDistance) {
          bestDistance = d;
          best = candidate;
        }
      }
    }

    Targeting.target[eid] = best;
  }
}

/** True when the current target still exists, is hostile and is in range. */
function isTargetStillValid(world: GameWorld, eid: number): boolean {
  const target = Targeting.target[eid] as number;
  if (target === 0) return false;
  if (!hasComponent(world, Active, target)) return false;
  if ((Health.current[target] as number) <= 0) return false;
  if ((Owner.playerId[target] as number) === (Owner.playerId[eid] as number)) return false;

  const range = Targeting.detectionRange[eid] as number;
  const d = distanceSquared(
    Position.x[eid] as number,
    Position.y[eid] as number,
    Position.x[target] as number,
    Position.y[target] as number
  );
  return d <= range * range;
}
