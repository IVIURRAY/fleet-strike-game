/**
 * Player domain types.
 *
 * Source: docs/GameLoop.md ("Starting Conditions"), docs/ResourcesEconomy.md
 */

import type { PlayerId } from './common';
import type { ResourceCaps, ResourceIncome, ResourcePool } from './resources';

/** Connection lifecycle of a player within a room. */
export const PLAYER_STATUSES = ['connected', 'disconnected'] as const;
export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

/** Authoritative per-player state held by the server. */
export interface Player {
  readonly id: PlayerId;
  name: string;
  status: PlayerStatus;
  resources: ResourcePool;
  income: ResourceIncome;
  caps: ResourceCaps;
  /** Fleet rally point. All owned ships steer toward this position. */
  waypoint: { x: number; y: number };
  /** Planet indices currently controlled. */
  controlledPlanets: number[];
  /**
   * Fractional discount on building upgrades from Research Labs, e.g. 0.25.
   */
  upgradeDiscount: number;
  /** Fractional factory speed bonus from Research Labs, e.g. 0.1. */
  productionSpeedBonus: number;
  /** Cumulative statistics, surfaced on the victory screen. */
  stats: PlayerStats;
}

/** Match statistics tracked per player. */
export interface PlayerStats {
  shipsProduced: number;
  shipsLost: number;
  shipsKilled: number;
  buildingsConstructed: number;
  goldEarned: number;
  planetsCaptured: number;
}

/** Player state as sent to clients. The opponent's view is redacted. */
export interface PlayerView {
  readonly id: PlayerId;
  readonly name: string;
  readonly status: PlayerStatus;
  readonly resources: ResourcePool;
  readonly income: ResourceIncome;
  readonly caps: ResourceCaps;
  readonly waypoint: { readonly x: number; readonly y: number };
  readonly controlledPlanets: readonly number[];
  readonly shipCount: number;
}

/** Creates a zeroed statistics record. */
export function emptyPlayerStats(): PlayerStats {
  return {
    shipsProduced: 0,
    shipsLost: 0,
    shipsKilled: 0,
    buildingsConstructed: 0,
    goldEarned: 0,
    planetsCaptured: 0,
  };
}
