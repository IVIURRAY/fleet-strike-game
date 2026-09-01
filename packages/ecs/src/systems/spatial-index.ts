/**
 * Spatial index maintenance.
 *
 * The design docs define `updateGrid` but never say which system calls it or
 * when the grid is cleared. This system owns that lifecycle: it runs at the
 * very top of the tick so every later system queries a current index.
 */

import { Health, Position } from '../components';
import { buildingQuery, planetQuery, shipQuery } from '../queries';
import type { GameWorld } from '../world';

/** Rebuilds the ship and structure spatial indexes for this tick. */
export function spatialIndexSystem(world: GameWorld): void {
  const { shipGrid, structureGrid } = world.context;

  shipGrid.clear();
  const ships = shipQuery(world);
  for (let i = 0; i < ships.length; i += 1) {
    const eid = ships[i] as number;
    shipGrid.insert(eid, Position.x[eid] as number, Position.y[eid] as number);
  }

  structureGrid.clear();
  const buildings = buildingQuery(world);
  for (let i = 0; i < buildings.length; i += 1) {
    const eid = buildings[i] as number;
    // Only damageable structures are indexed; the Command Center is skipped
    // because it cannot be destroyed.
    if ((Health.max[eid] as number) <= 0) continue;
    structureGrid.insert(eid, Position.x[eid] as number, Position.y[eid] as number);
  }

  // Planet entities are cached so the capture system does not re-run its query.
  const planets = planetQuery(world);
  const cache = world.context.planetEntities;
  cache.length = 0;
  for (let i = 0; i < planets.length; i += 1) {
    cache.push(planets[i] as number);
  }
}
