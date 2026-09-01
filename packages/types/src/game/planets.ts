/**
 * Planet and moon domain types.
 *
 * Source: docs/Map_Design.md
 */

import type { ExoticResource, ResourceType } from './resources';
import type { OwnerId, PlayerId } from './common';

/** Planet archetypes in the 7-planet linear chain. */
export const PLANET_KINDS = ['capital', 'gold', 'crystal', 'center', 'gas', 'tungsten'] as const;
export type PlanetKind = (typeof PLANET_KINDS)[number];

/** Static definition of one planet in the map layout. */
export interface PlanetDefinition {
  /** Stable slot index along the chain, 0 (Home A) through 6 (Home B). */
  readonly index: number;
  readonly id: string;
  readonly name: string;
  readonly kind: PlanetKind;
  readonly x: number;
  readonly y: number;
  /** Visual/collision radius in world units. */
  readonly radius: number;
  /** Owner at match start: 1 or 2 for capitals, 0 for neutral planets. */
  readonly initialOwner: OwnerId;
  /** Exotic resource granted while this planet is controlled, if any. */
  readonly exotic: ExoticResource | null;
  /** Multiplicative income bonus applied to matching resource buildings. */
  readonly incomeBonus: { readonly resource: ResourceType; readonly multiplier: number } | null;
  readonly moons: readonly MoonDefinition[];
}

/** Static definition of a moon orbiting a planet. */
export interface MoonDefinition {
  readonly id: string;
  readonly name: string;
  /** Index of the parent planet in the chain. */
  readonly planetIndex: number;
  /** Distance from the parent planet's centre in world units. */
  readonly orbitRadius: number;
  /** Full revolutions per second (derived from the documented 2-4 minute period). */
  readonly orbitSpeed: number;
  /** Starting angle in radians, spreading moons around the parent. */
  readonly initialAngle: number;
  readonly radius: number;
  /** Number of buildable slots. Always 3 per docs/Map_Design.md. */
  readonly buildingSlots: number;
}

/** Live planet state broadcast to clients. */
export interface PlanetState {
  readonly index: number;
  readonly owner: OwnerId;
  /**
   * Tug-of-war progress in the range [-100, 100]. Negative favours player 1,
   * positive favours player 2 (docs/ECS_game_design_system.md `Capturable`).
   */
  readonly captureProgress: number;
  /** Ships of each player currently inside the capture radius. */
  readonly presence: Readonly<Record<PlayerId, number>>;
  readonly buildingIds: readonly number[];
}

/** Live moon state broadcast to clients. */
export interface MoonState {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly owner: OwnerId;
  readonly buildingIds: readonly number[];
}
