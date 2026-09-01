/**
 * Building site allocation.
 *
 * Chooses where a new structure physically sits, and resolves moon ids to
 * entities. Split from `GameRoom` so the room does not carry map geometry.
 */

import { PLANETS } from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import { PlanetRef, Position, buildingQuery, orbitalQuery, slotPosition } from '@fleet-strike/ecs';

export class SiteAllocator {
  /** Next slot index per site, so successive structures do not overlap. */
  private readonly counters = new Map<string, number>();

  /**
   * Finds a moon entity by its definition id.
   *
   * Moons are created in map order, so counting how many of a planet's moons
   * have been seen yields the definition index.
   */
  findMoonEntity(world: GameWorld, moonId: string): number {
    const moons = orbitalQuery(world);
    const seenPerPlanet = new Map<number, number>();

    for (let i = 0; i < moons.length; i += 1) {
      const eid = moons[i] as number;
      const planetIndex = PlanetRef.index[eid] as number;
      const planet = PLANETS[planetIndex];
      if (planet === undefined) continue;

      const localIndex = seenPerPlanet.get(planetIndex) ?? 0;
      seenPerPlanet.set(planetIndex, localIndex + 1);

      if (planet.moons[localIndex]?.id === moonId) return eid;
    }

    return 0;
  }

  /** Allocates the next free position on a planet surface or a moon. */
  allocate(world: GameWorld, planetIndex: number, moonId: string | null): { x: number; y: number } {
    const planet = PLANETS[planetIndex];
    if (planet === undefined) return { x: 0, y: 0 };

    const key = moonId ?? `planet-${planetIndex}`;
    const slot = this.counters.get(key) ?? 0;
    this.counters.set(key, slot + 1);

    if (moonId === null) {
      // Offset past structures already present so positions never collide, even
      // if the counter was reset.
      const existing = countBuildingsOnPlanet(world, planetIndex);
      return slotPosition(planet.x, planet.y, planet.radius, Math.max(slot, existing));
    }

    const moonEntity = this.findMoonEntity(world, moonId);
    const definition = planet.moons.find((moon) => moon.id === moonId);
    if (moonEntity === 0 || definition === undefined) return { x: planet.x, y: planet.y };

    // Moon buildings sit on the moon's surface, spread across its three slots.
    const angle = (Math.PI * 2 * slot) / definition.buildingSlots;
    return {
      x: (Position.x[moonEntity] as number) + Math.cos(angle) * definition.radius * 0.6,
      y: (Position.y[moonEntity] as number) + Math.sin(angle) * definition.radius * 0.6,
    };
  }
}

/** Counts buildings belonging to a planet, including those on its moons. */
export function countBuildingsOnPlanet(world: GameWorld, planetIndex: number): number {
  const buildings = buildingQuery(world);
  let count = 0;
  for (let i = 0; i < buildings.length; i += 1) {
    if ((PlanetRef.index[buildings[i] as number] as number) === planetIndex) count += 1;
  }
  return count;
}
