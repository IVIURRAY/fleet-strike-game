/**
 * Server to client message protocol.
 *
 * Source: docs/Technical_Architecture.md ("Network Protocol"). Full snapshots
 * are sent every FULL_SNAPSHOT_INTERVAL seconds; deltas at BROADCAST_RATE Hz.
 */

import type { PlayerId } from '../game/common';
import type { MatchPhase, MatchResult, WorldSnapshot } from '../game/match';
import type { PlayerView } from '../game/player';
import type { PlanetState } from '../game/planets';
import type { BuildingState } from '../game/buildings';
import type { GameEvent } from './events';

/** Per-entity delta. Absent fields are unchanged since the last update. */
export interface EntityUpdate {
  readonly id: number;
  readonly x?: number;
  readonly y?: number;
  readonly rotation?: number;
  readonly hp?: number;
}

/** Room created; contains the code to share with the opponent. */
export interface RoomCreatedMessage {
  readonly type: 'ROOM_CREATED';
  readonly code: string;
  readonly playerId: PlayerId;
}

/** Successfully joined a room. */
export interface RoomJoinedMessage {
  readonly type: 'ROOM_JOINED';
  readonly code: string;
  readonly playerId: PlayerId;
  readonly players: readonly PlayerView[];
}

/** Room membership or phase changed while in the lobby. */
export interface RoomUpdatedMessage {
  readonly type: 'ROOM_UPDATED';
  readonly phase: MatchPhase;
  readonly players: readonly PlayerView[];
}

/** Both players present; the match is starting. Carries the initial snapshot. */
export interface MatchStartedMessage {
  readonly type: 'MATCH_STARTED';
  readonly snapshot: WorldSnapshot;
  /** Seconds of the non-interactive setup phase remaining. */
  readonly setupSeconds: number;
}

/** Authoritative full state. Sent on join and periodically as a baseline. */
export interface FullStateMessage {
  readonly type: 'FULL_STATE';
  readonly snapshot: WorldSnapshot;
}

/** Incremental state update. */
export interface StateUpdateMessage {
  readonly type: 'STATE_UPDATE';
  readonly tick: number;
  readonly elapsed: number;
  readonly entities: readonly EntityUpdate[];
  /** Ids of entities that no longer exist. */
  readonly removed: readonly number[];
  /** Entities created since the last update, sent in full. */
  readonly created: WorldSnapshot['ships'];
  readonly projectiles: WorldSnapshot['projectiles'];
  readonly planets: readonly PlanetState[];
  readonly buildings: readonly BuildingState[];
  readonly players: readonly PlayerView[];
}

/** A batch of transient events for the current tick. */
export interface GameEventsMessage {
  readonly type: 'GAME_EVENTS';
  readonly events: readonly GameEvent[];
}

/** The match ended. */
export interface MatchEndedMessage {
  readonly type: 'MATCH_ENDED';
  readonly result: MatchResult;
}

/** A protocol or command error. */
export interface ErrorMessage {
  readonly type: 'ERROR';
  readonly code: string;
  readonly message: string;
}

/** Latency probe response. */
export interface PongMessage {
  readonly type: 'PONG';
  readonly sentAt: number;
}

/** Every message a server may send. */
export type ServerMessage =
  | RoomCreatedMessage
  | RoomJoinedMessage
  | RoomUpdatedMessage
  | MatchStartedMessage
  | FullStateMessage
  | StateUpdateMessage
  | GameEventsMessage
  | MatchEndedMessage
  | ErrorMessage
  | PongMessage;

export const SERVER_MESSAGE_TYPES = [
  'ROOM_CREATED',
  'ROOM_JOINED',
  'ROOM_UPDATED',
  'MATCH_STARTED',
  'FULL_STATE',
  'STATE_UPDATE',
  'GAME_EVENTS',
  'MATCH_ENDED',
  'ERROR',
  'PONG',
] as const;
export type ServerMessageType = (typeof SERVER_MESSAGE_TYPES)[number];
