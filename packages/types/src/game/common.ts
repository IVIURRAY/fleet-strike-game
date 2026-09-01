/**
 * Primitive shared types used across every Fleet Strike package.
 */

/** A bitECS entity id. Entities are plain numbers. */
export type EntityId = number;

/**
 * Player slot within a match. `0` is reserved for "neutral"/unowned so that a
 * single numeric field can express planet ownership as well as ship ownership.
 */
export const PLAYER_IDS = [1, 2] as const;
export type PlayerId = (typeof PLAYER_IDS)[number];

/** Ownership value stored on entities: 0 = neutral, 1 = player one, 2 = player two. */
export type OwnerId = 0 | PlayerId;

/** A point in world space. World units are abstract (docs/Map_Design.md). */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

/** A mutable 2D vector, used in hot paths where allocation must be avoided. */
export interface MutableVector2 {
  x: number;
  y: number;
}

/** An axis-aligned rectangle in world space. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A circle in world space, used for capture radii and collision. */
export interface Circle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/** Returns the opposing player for a given player. */
export function opponentOf(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1;
}
