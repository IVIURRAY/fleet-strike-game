/**
 * Victory conditions.
 *
 * Primary condition is conquest: hold all seven planets simultaneously
 * (docs/GameLoop.md). Admiral assassination is Phase 2 and not implemented.
 *
 * A time limit with a most-planets-held tiebreak is also applied. The docs
 * target a 20-minute match but define no timeout, which leaves matches formally
 * unbounded; the docs themselves flag this as an open gap.
 */

import type { MatchResult, PlayerId } from '@fleet-strike/types';
import { MATCH_TIME_LIMIT, PLANETS_TO_WIN } from '@fleet-strike/config';

import type { GameWorld } from '../world';

/** Checks for a winner and records the result on the world context. */
export function victorySystem(world: GameWorld): void {
  const { context } = world;
  if (context.phase !== 'playing') return;

  const conquest = findConquestWinner(world);
  if (conquest !== null) {
    finish(world, conquest, 'conquest');
    return;
  }

  if (context.elapsed >= MATCH_TIME_LIMIT) {
    finish(world, findPlanetLeader(world), 'timeout');
  }
}

/** Returns the player holding every planet, or `null`. */
function findConquestWinner(world: GameWorld): PlayerId | null {
  for (const [playerId, player] of world.context.players) {
    if (player.controlledPlanets.length >= PLANETS_TO_WIN) return playerId;
  }
  return null;
}

/** Returns the player holding the most planets, or `null` for a tie. */
function findPlanetLeader(world: GameWorld): PlayerId | null {
  let best: PlayerId | null = null;
  let bestCount = -1;
  let tied = false;

  for (const [playerId, player] of world.context.players) {
    const count = player.controlledPlanets.length;
    if (count > bestCount) {
      bestCount = count;
      best = playerId;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }

  return tied ? null : best;
}

/** Records a match result and moves the world into the finished phase. */
export function finish(
  world: GameWorld,
  winner: PlayerId | null,
  reason: MatchResult['reason']
): void {
  const { context } = world;
  if (context.phase === 'finished') return;

  context.phase = 'finished';
  context.result = {
    winner,
    reason,
    durationSeconds: context.elapsed,
    planetsHeld: {
      1: context.players.get(1)?.controlledPlanets.length ?? 0,
      2: context.players.get(2)?.controlledPlanets.length ?? 0,
    },
  };
}

/** Ends the match immediately because a player left. */
export function forfeit(world: GameWorld, quitter: PlayerId): void {
  finish(world, quitter === 1 ? 2 : 1, 'forfeit');
}
