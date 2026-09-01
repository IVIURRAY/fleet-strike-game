/**
 * Client to server message protocol.
 *
 * Source: docs/Technical_Architecture.md ("Network Protocol"). The documented
 * union only covers the three in-match commands; the room lifecycle messages
 * exercised by the documented Playwright tests are added here.
 */

import type { BuildingType } from '../game/buildings';

/** Create a new room and become player 1. */
export interface CreateRoomMessage {
  readonly type: 'CREATE_ROOM';
  readonly playerName: string;
}

/** Join an existing room by its share code. */
export interface JoinRoomMessage {
  readonly type: 'JOIN_ROOM';
  readonly code: string;
  readonly playerName: string;
}

/** Leave the current room. */
export interface LeaveRoomMessage {
  readonly type: 'LEAVE_ROOM';
}

/** Move the fleet rally point. */
export interface SetWaypointMessage {
  readonly type: 'SET_WAYPOINT';
  readonly x: number;
  readonly y: number;
}

/** Construct a building on a controlled planet or one of its moons. */
export interface BuildStructureMessage {
  readonly type: 'BUILD_STRUCTURE';
  readonly planetIndex: number;
  /** Moon id when building on a moon, `null` for the planet surface. */
  readonly moonId: string | null;
  readonly buildingType: BuildingType;
}

/** Upgrade an existing building to its next level. */
export interface UpgradeBuildingMessage {
  readonly type: 'UPGRADE_BUILDING';
  readonly buildingId: number;
}

/** Latency probe. */
export interface PingMessage {
  readonly type: 'PING';
  readonly sentAt: number;
}

/** Every message a client may send. */
export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | SetWaypointMessage
  | BuildStructureMessage
  | UpgradeBuildingMessage
  | PingMessage;

/** Discriminant values, useful for exhaustive validation. */
export const CLIENT_MESSAGE_TYPES = [
  'CREATE_ROOM',
  'JOIN_ROOM',
  'LEAVE_ROOM',
  'SET_WAYPOINT',
  'BUILD_STRUCTURE',
  'UPGRADE_BUILDING',
  'PING',
] as const;
export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[number];
