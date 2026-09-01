/**
 * The simulation world.
 *
 * bitECS stores only numeric component data. Everything that cannot live in a
 * typed array — player resource pools, the event queue, spatial indexes — is
 * held on this container alongside the bitECS world.
 */

import { createWorld as createBitWorld } from 'bitecs';
import type { IWorld } from 'bitecs';
import type { GameEvent, MatchPhase, MatchResult, Player, PlayerId } from '@fleet-strike/types';
import { SPATIAL_CELL_SIZE } from '@fleet-strike/config';
import { SpatialGrid, createRandom } from '@fleet-strike/utils';
import type { RandomSource } from '@fleet-strike/utils';

/** Bookkeeping the simulation needs but bitECS cannot store. */
export interface GameContext {
  /** Monotonic tick counter. */
  tick: number;
  /** Seconds of simulated time elapsed since the match began. */
  elapsed: number;
  /** Seconds remaining in the non-interactive setup phase. */
  setupRemaining: number;
  phase: MatchPhase;
  result: MatchResult | null;
  /** Per-player state, keyed by player id. */
  players: Map<PlayerId, Player>;
  /** Ship entity ids per player, maintained incrementally. */
  planetEntities: number[];
  /** Events produced this tick, drained by the broadcaster. */
  events: GameEvent[];
  /** Broad-phase index of all ships, rebuilt each tick. */
  shipGrid: SpatialGrid;
  /** Broad-phase index of all damageable structures, rebuilt each tick. */
  structureGrid: SpatialGrid;
  /** Deterministic random source. */
  random: RandomSource;
  /** Entities scheduled for removal at the end of the tick. */
  pendingRemoval: number[];
  /** Accumulator driving the one-second economy and capture systems. */
  slowAccumulator: number;
  /** Accumulated fractional resources, so per-tick income is not lost to rounding. */
  incomeAccumulator: Map<PlayerId, number>;
}

/** A bitECS world plus Fleet Strike's non-numeric state. */
export type GameWorld = IWorld & { context: GameContext };

/** Creates an empty world. `seed` makes the simulation reproducible. */
export function createGameWorld(seed = 1): GameWorld {
  const world = createBitWorld() as GameWorld;
  world.context = {
    tick: 0,
    elapsed: 0,
    setupRemaining: 0,
    phase: 'lobby',
    result: null,
    players: new Map(),
    planetEntities: [],
    events: [],
    shipGrid: new SpatialGrid(SPATIAL_CELL_SIZE),
    structureGrid: new SpatialGrid(SPATIAL_CELL_SIZE),
    random: createRandom(seed),
    pendingRemoval: [],
    slowAccumulator: 0,
    incomeAccumulator: new Map(),
  };
  return world;
}

/** Queues an event for broadcast at the end of the tick. */
export function emitEvent(world: GameWorld, event: GameEvent): void {
  world.context.events.push(event);
}

/** Removes and returns every queued event. */
export function drainEvents(world: GameWorld): GameEvent[] {
  const { events } = world.context;
  const drained = events.slice();
  events.length = 0;
  return drained;
}

/** Looks up a player, throwing when the id is not in the match. */
export function getPlayer(world: GameWorld, playerId: PlayerId): Player {
  const player = world.context.players.get(playerId);
  if (player === undefined) {
    throw new Error(`Player ${playerId} is not part of this match`);
  }
  return player;
}

/** Marks an entity for removal once all systems have finished this tick. */
export function scheduleRemoval(world: GameWorld, entity: number): void {
  world.context.pendingRemoval.push(entity);
}
