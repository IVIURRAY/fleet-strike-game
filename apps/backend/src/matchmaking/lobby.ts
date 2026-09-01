/**
 * Room registry and matchmaking.
 *
 * Rooms are created on demand with a share code, and reaped once empty so a
 * long-running server does not accumulate dead matches.
 */

import type { RoomSummary } from '@fleet-strike/types';
import { EMPTY_ROOM_TTL, ROOM_CODE_LENGTH } from '@fleet-strike/config';
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '@fleet-strike/utils';

import { GameRoom } from './room';

/** Maximum attempts to find an unused room code before giving up. */
const MAX_CODE_ATTEMPTS = 50;

export class Lobby {
  private readonly rooms = new Map<string, GameRoom>();
  /** Timestamp, in ms, at which each empty room becomes eligible for reaping. */
  private readonly emptySince = new Map<string, number>();

  get roomCount(): number {
    return this.rooms.size;
  }

  /** Creates a room with a fresh, unused code. */
  createRoom(): GameRoom {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateRoomCode();
      if (!this.rooms.has(code)) {
        const room = new GameRoom(code);
        this.rooms.set(code, room);
        return room;
      }
    }
    throw new Error(`Could not allocate a free ${ROOM_CODE_LENGTH} character room code`);
  }

  /** Looks up a room by code, accepting any casing or surrounding whitespace. */
  findRoom(code: string): GameRoom | undefined {
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) return undefined;
    return this.rooms.get(normalized);
  }

  /** Removes a room and stops its loop. */
  removeRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room === undefined) return;
    room.destroy();
    this.rooms.delete(code);
    this.emptySince.delete(code);
  }

  /**
   * Reaps rooms that have been empty for longer than the TTL.
   *
   * `now` is injectable so the behaviour is testable without waiting.
   */
  reapEmptyRooms(now: number = Date.now()): number {
    let reaped = 0;

    for (const [code, room] of this.rooms) {
      if (!room.isEmpty) {
        this.emptySince.delete(code);
        continue;
      }

      const since = this.emptySince.get(code);
      if (since === undefined) {
        this.emptySince.set(code, now);
        continue;
      }

      if (now - since >= EMPTY_ROOM_TTL * 1000) {
        this.removeRoom(code);
        reaped += 1;
      }
    }

    return reaped;
  }

  /** Finds a room awaiting a second player, for quick match. */
  findOpenRoom(): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (!room.isFull && room.phase === 'lobby') return room;
    }
    return undefined;
  }

  /** Summaries for the status endpoint. */
  listRooms(): RoomSummary[] {
    return [...this.rooms.values()].map((room) => ({
      code: room.code,
      phase: room.phase,
      playerCount: room.playerCount,
      isFull: room.isFull,
    }));
  }

  /** Stops every room. Used on shutdown. */
  destroyAll(): void {
    for (const room of this.rooms.values()) {
      room.destroy();
    }
    this.rooms.clear();
    this.emptySince.clear();
  }
}
