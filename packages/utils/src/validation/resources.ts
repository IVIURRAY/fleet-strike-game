/**
 * Resource arithmetic and affordability checks.
 *
 * The server is authoritative over every spend, so these helpers are shared
 * with the client purely so the UI can grey out unaffordable options.
 */

import type { ResourceCaps, ResourceCost, ResourcePool, ResourceType } from '@fleet-strike/types';
import { EXOTIC_CAP } from '@fleet-strike/config';

/** Names the first resource in `cost` that `pool` cannot cover. */
export function missingResource(pool: ResourcePool, price: ResourceCost): ResourceType | null {
  if (pool.gold < price.gold) return 'gold';
  if (pool.manpower < price.manpower) return 'manpower';
  if (pool.crystal < price.crystal) return 'crystal';
  if (pool.gas < price.gas) return 'gas';
  if (pool.tungsten < price.tungsten) return 'tungsten';
  return null;
}

/** True when every component of `price` is covered by `pool`. */
export function hasResources(pool: ResourcePool, price: ResourceCost): boolean {
  return missingResource(pool, price) === null;
}

/**
 * Deducts `price` from `pool` in place.
 *
 * Returns `false` and leaves the pool untouched when the player cannot afford
 * the cost, so callers cannot accidentally drive a balance negative.
 */
export function spend(pool: ResourcePool, price: ResourceCost): boolean {
  if (!hasResources(pool, price)) return false;
  pool.gold -= price.gold;
  pool.manpower -= price.manpower;
  pool.crystal -= price.crystal;
  pool.gas -= price.gas;
  pool.tungsten -= price.tungsten;
  return true;
}

/** Adds `amount` of a resource to `pool`, respecting the relevant cap. */
export function grant(
  pool: ResourcePool,
  resource: ResourceType,
  amount: number,
  caps: ResourceCaps
): void {
  if (amount <= 0) return;
  switch (resource) {
    case 'gold':
      // Gold is explicitly uncapped in docs/ResourcesEconomy.md.
      pool.gold += amount;
      return;
    case 'manpower':
      pool.manpower = Math.min(pool.manpower + amount, caps.manpower);
      return;
    case 'crystal':
      pool.crystal = Math.min(pool.crystal + amount, caps.crystal);
      return;
    case 'gas':
      pool.gas = Math.min(pool.gas + amount, caps.gas);
      return;
    case 'tungsten':
      pool.tungsten = Math.min(pool.tungsten + amount, caps.tungsten);
      return;
  }
}

/** Refunds a ship's manpower on death, respecting the manpower cap. */
export function refundManpower(pool: ResourcePool, amount: number, caps: ResourceCaps): void {
  pool.manpower = Math.min(pool.manpower + amount, caps.manpower);
}

/** Builds a caps record from a manpower ceiling, using the fixed exotic cap. */
export function makeCaps(manpowerCap: number): ResourceCaps {
  return {
    manpower: manpowerCap,
    crystal: EXOTIC_CAP,
    gas: EXOTIC_CAP,
    tungsten: EXOTIC_CAP,
  };
}
