/**
 * Helpers for declaring building and unit costs concisely.
 */

import type { ResourceCost } from '@fleet-strike/types';

/** Partial cost specification; omitted resources default to zero. */
export interface CostSpec {
  readonly gold?: number;
  readonly manpower?: number;
  readonly crystal?: number;
  readonly gas?: number;
  readonly tungsten?: number;
}

/** Expands a partial cost into a fully populated `ResourceCost`. */
export function cost(spec: CostSpec): ResourceCost {
  return {
    gold: spec.gold ?? 0,
    manpower: spec.manpower ?? 0,
    crystal: spec.crystal ?? 0,
    gas: spec.gas ?? 0,
    tungsten: spec.tungsten ?? 0,
  };
}

/** True when `pool` can cover every component of `price`. */
export function canAfford(
  pool: { gold: number; manpower: number; crystal: number; gas: number; tungsten: number },
  price: ResourceCost
): boolean {
  return (
    pool.gold >= price.gold &&
    pool.manpower >= price.manpower &&
    pool.crystal >= price.crystal &&
    pool.gas >= price.gas &&
    pool.tungsten >= price.tungsten
  );
}

/** Scales every component of a cost, used for upgrade discounts. */
export function scaleCost(price: ResourceCost, multiplier: number): ResourceCost {
  return {
    gold: Math.ceil(price.gold * multiplier),
    manpower: Math.ceil(price.manpower * multiplier),
    crystal: Math.ceil(price.crystal * multiplier),
    gas: Math.ceil(price.gas * multiplier),
    tungsten: Math.ceil(price.tungsten * multiplier),
  };
}
