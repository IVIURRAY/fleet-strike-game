/**
 * Match and room lifecycle types.
 *
 * Source: docs/GameLoop.md ("Match Structure", "Win Conditions")
 */

import type { OwnerId, PlayerId } from './common';
import type { PlayerView } from './player';
import type { BuildingState } from './buildings';
import type { MoonState, PlanetState } from './planets';

/** Room lifecycle, from creation through to a finished match. */
export const MATCH_PHASES = ['lobby', 'setup', 'playing', 'finished'] as const;
export type MatchPhase = (typeof MATCH_PHASES)[number];

/** How a finished match was decided. */
export const VICTORY_REASONS = ['conquest', 'timeout', 'forfeit'] as const;
export type VictoryReason = (typeof VICTORY_REASONS)[number];

/** Outcome of a finished match. */
export interface MatchResult {
  /** Winning player, or `null` for a draw. */
  readonly winner: PlayerId | null;
  readonly reason: VictoryReason;
  /** Elapsed match time in seconds. */
  readonly durationSeconds: number;
  readonly planetsHeld: Readonly<Record<PlayerId, number>>;
}

/** A ship as serialised in a full state snapshot. */
export interface ShipSnapshot {
  readonly id: number;
  readonly type: number;
  readonly owner: PlayerId;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
  readonly hp: number;
  readonly maxHp: number;
}

/** A projectile as serialised in a full state snapshot. */
export interface ProjectileSnapshot {
  readonly id: number;
  readonly weapon: number;
  readonly owner: PlayerId;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
}

/** Complete, self-contained view of the world at a point in time. */
export interface WorldSnapshot {
  readonly tick: number;
  /** Seconds elapsed since the match began. */
  readonly elapsed: number;
  readonly phase: MatchPhase;
  readonly players: readonly PlayerView[];
  readonly planets: readonly PlanetState[];
  readonly moons: readonly MoonState[];
  readonly buildings: readonly BuildingState[];
  readonly ships: readonly ShipSnapshot[];
  readonly projectiles: readonly ProjectileSnapshot[];
  readonly result: MatchResult | null;
}

/** Summary of a room used by the lobby UI. */
export interface RoomSummary {
  readonly code: string;
  readonly phase: MatchPhase;
  readonly playerCount: number;
  readonly isFull: boolean;
}

/** Ownership tally used by the timeout tiebreak. */
export type PlanetOwnershipTally = Readonly<Record<OwnerId, number>>;
