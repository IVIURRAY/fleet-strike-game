/**
 * Resource types and player resource pools.
 *
 * Source: docs/ResourcesEconomy.md
 */

/** Gold and manpower are always available; exotics are gated by planet control. */
export const BASIC_RESOURCES = ['gold', 'manpower'] as const;
export type BasicResource = (typeof BASIC_RESOURCES)[number];

export const EXOTIC_RESOURCES = ['crystal', 'gas', 'tungsten'] as const;
export type ExoticResource = (typeof EXOTIC_RESOURCES)[number];

export const RESOURCES = [...BASIC_RESOURCES, ...EXOTIC_RESOURCES] as const;
export type ResourceType = (typeof RESOURCES)[number];

/**
 * The price of a ship or building. Gold is always required; manpower is only
 * charged for ships, and exotics only for buildings (see docs/ResourcesEconomy.md
 * — the per-ship exotic costs listed there apply to Phase 2 units only).
 */
export interface ResourceCost {
  readonly gold: number;
  readonly manpower: number;
  readonly crystal: number;
  readonly gas: number;
  readonly tungsten: number;
}

/** A player's current holdings. */
export interface ResourcePool {
  gold: number;
  manpower: number;
  crystal: number;
  gas: number;
  tungsten: number;
}

/** Per-second income, derived from buildings and controlled planets. */
export interface ResourceIncome {
  gold: number;
  manpower: number;
  crystal: number;
  gas: number;
  tungsten: number;
}

/** Storage limits. Gold is uncapped; manpower and exotics are capped. */
export interface ResourceCaps {
  readonly manpower: number;
  readonly crystal: number;
  readonly gas: number;
  readonly tungsten: number;
}

/** Creates a zeroed cost, useful as a base for partial overrides. */
export function emptyCost(): ResourceCost {
  return { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 };
}
