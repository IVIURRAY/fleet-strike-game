/**
 * Economy system — resource income.
 *
 * Income is continuous, not wave-based (docs/ResourcesEconomy.md: "Per-second
 * generation — Continuous income, no waves"). It is recomputed from the set of
 * live buildings each time it runs rather than cached, so capturing or losing a
 * planet takes effect immediately with no bookkeeping to get out of sync.
 */

import { hasComponent } from 'bitecs';
import type { PlayerId, ResourceIncome } from '@fleet-strike/types';
import { BUILDING_TYPES, RESOURCES } from '@fleet-strike/types';
import {
  EXOTIC_PER_SECOND,
  MANPOWER_BASE_CAP,
  PLANETS,
  manpowerCapBonus,
} from '@fleet-strike/config';
import { grant, makeCaps } from '@fleet-strike/utils';

import {
  BuildingClass,
  Owner,
  PlanetRef,
  ResourceGenerator,
  UnderConstruction,
} from '../components';
import { buildingQuery, resourceQuery } from '../queries';
import type { GameWorld } from '../world';

/** Recomputes income and caps, then credits resources for `deltaTime`. */
export function economySystem(world: GameWorld, deltaTime: number): void {
  recalculateIncome(world);

  for (const player of world.context.players.values()) {
    const { income, resources, caps } = player;
    for (const resource of RESOURCES) {
      const amount = income[resource] * deltaTime;
      if (amount > 0) {
        grant(resources, resource, amount, caps);
      }
    }
    player.stats.goldEarned += income.gold * deltaTime;
  }
}

/**
 * Rebuilds each player's income and manpower cap from their live buildings and
 * controlled planets.
 */
export function recalculateIncome(world: GameWorld): void {
  const { players } = world.context;

  const totals = new Map<PlayerId, ResourceIncome>();
  const manpowerCaps = new Map<PlayerId, number>();

  for (const playerId of players.keys()) {
    totals.set(playerId, { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 });
    manpowerCaps.set(playerId, MANPOWER_BASE_CAP);
  }

  // Economy buildings.
  const generators = resourceQuery(world);
  for (let i = 0; i < generators.length; i += 1) {
    const eid = generators[i] as number;
    if (hasComponent(world, UnderConstruction, eid)) continue;

    const owner = Owner.playerId[eid] as PlayerId;
    const income = totals.get(owner);
    if (income === undefined) continue;

    const resource = RESOURCES[ResourceGenerator.resourceId[eid] as number];
    if (resource === undefined) continue;

    const amount =
      (ResourceGenerator.perSecond[eid] as number) * (ResourceGenerator.multiplier[eid] as number);
    income[resource] += amount;
  }

  // Manpower caps from completed Manpower Centers.
  const buildings = buildingQuery(world);
  for (let i = 0; i < buildings.length; i += 1) {
    const eid = buildings[i] as number;
    if (hasComponent(world, UnderConstruction, eid)) continue;

    const buildingType = BUILDING_TYPES[BuildingClass.typeId[eid] as number];
    if (buildingType !== 'manpowerCenter') continue;

    const owner = Owner.playerId[eid] as PlayerId;
    const current = manpowerCaps.get(owner);
    if (current === undefined) continue;
    manpowerCaps.set(
      owner,
      current + manpowerCapBonus(buildingType, BuildingClass.level[eid] as number)
    );
  }

  // Exotic resources come from planet control alone, with no building required.
  for (const planetEntity of world.context.planetEntities) {
    const index = PlanetRef.index[planetEntity] as number;
    const definition = PLANETS[index];
    if (definition?.exotic === undefined || definition.exotic === null) continue;

    const owner = Owner.playerId[planetEntity] as PlayerId;
    const income = totals.get(owner);
    if (income === undefined) continue;
    income[definition.exotic] += EXOTIC_PER_SECOND;
  }

  for (const [playerId, player] of players) {
    const income = totals.get(playerId);
    if (income === undefined) continue;

    // Command Center gold is not added here. It is produced by the building's
    // own ResourceGenerator, counted in the loop above, and ownership follows
    // the planet when it is captured. Adding it again here would double it.
    player.income = income;
    player.caps = makeCaps(manpowerCaps.get(playerId) ?? MANPOWER_BASE_CAP);
    // Clamp in case a Manpower Center was just destroyed.
    if (player.resources.manpower > player.caps.manpower) {
      player.resources.manpower = player.caps.manpower;
    }
  }
}
