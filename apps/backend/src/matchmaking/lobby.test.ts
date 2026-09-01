import { beforeEach, describe, expect, it } from 'vitest';

import { EMPTY_ROOM_TTL, ROOM_CODE_LENGTH } from '@fleet-strike/config';
import type { ServerMessage } from '@fleet-strike/types';

import { Lobby } from './lobby';
import type { PlayerConnection } from './room';

class FakeConnection implements PlayerConnection {
  private open = true;
  send(_message: ServerMessage): void {
    // Discarded; the lobby tests only care about seat bookkeeping.
  }
  close(): void {
    this.open = false;
  }
  get isOpen(): boolean {
    return this.open;
  }
}

describe('Lobby room creation', () => {
  let lobby: Lobby;

  beforeEach(() => {
    lobby = new Lobby();
  });

  it('starts empty', () => {
    expect(lobby.roomCount).toBe(0);
  });

  it('creates a room with a valid code', () => {
    const room = lobby.createRoom();
    expect(room.code).toHaveLength(ROOM_CODE_LENGTH);
    expect(lobby.roomCount).toBe(1);
  });

  it('gives every room a unique code', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      codes.add(lobby.createRoom().code);
    }
    expect(codes.size).toBe(200);
    lobby.destroyAll();
  });
});

describe('Lobby lookup', () => {
  let lobby: Lobby;

  beforeEach(() => {
    lobby = new Lobby();
  });

  it('finds a room by its exact code', () => {
    const room = lobby.createRoom();
    expect(lobby.findRoom(room.code)).toBe(room);
  });

  it('is case and whitespace insensitive', () => {
    const room = lobby.createRoom();
    expect(lobby.findRoom(room.code.toLowerCase())).toBe(room);
    expect(lobby.findRoom(`  ${room.code}  `)).toBe(room);
  });

  it('returns undefined for an unknown code', () => {
    expect(lobby.findRoom('ZZZZZZ')).toBeUndefined();
  });

  it('returns undefined for a malformed code without throwing', () => {
    expect(lobby.findRoom('')).toBeUndefined();
    expect(lobby.findRoom('TOOLONGCODE')).toBeUndefined();
    expect(lobby.findRoom('ABC!EF')).toBeUndefined();
  });
});

describe('Lobby matchmaking', () => {
  let lobby: Lobby;

  beforeEach(() => {
    lobby = new Lobby();
  });

  it('finds a room awaiting a second player', () => {
    const room = lobby.createRoom();
    room.addPlayer('Ada', new FakeConnection());
    expect(lobby.findOpenRoom()).toBe(room);
  });

  it('skips full rooms', () => {
    const room = lobby.createRoom();
    room.addPlayer('Ada', new FakeConnection());
    room.addPlayer('Grace', new FakeConnection());
    room.stop();
    expect(lobby.findOpenRoom()).toBeUndefined();
  });

  it('returns undefined when there are no rooms', () => {
    expect(lobby.findOpenRoom()).toBeUndefined();
  });
});

describe('Lobby reaping', () => {
  let lobby: Lobby;

  beforeEach(() => {
    lobby = new Lobby();
  });

  it('does not reap a room on first sight', () => {
    lobby.createRoom();
    expect(lobby.reapEmptyRooms(1000)).toBe(0);
    expect(lobby.roomCount).toBe(1);
  });

  it('reaps an empty room after the ttl', () => {
    lobby.createRoom();
    lobby.reapEmptyRooms(0);
    expect(lobby.reapEmptyRooms(EMPTY_ROOM_TTL * 1000 + 1)).toBe(1);
    expect(lobby.roomCount).toBe(0);
  });

  it('does not reap a room with a connected player', () => {
    const room = lobby.createRoom();
    room.addPlayer('Ada', new FakeConnection());

    lobby.reapEmptyRooms(0);
    expect(lobby.reapEmptyRooms(EMPTY_ROOM_TTL * 1000 + 1)).toBe(0);
    expect(lobby.roomCount).toBe(1);
  });

  it('reaps a room once its players disconnect', () => {
    const room = lobby.createRoom();
    const connection = new FakeConnection();
    room.addPlayer('Ada', connection);
    connection.close();

    lobby.reapEmptyRooms(0);
    expect(lobby.reapEmptyRooms(EMPTY_ROOM_TTL * 1000 + 1)).toBe(1);
  });

  it('resets the timer if a player rejoins before the ttl', () => {
    const room = lobby.createRoom();
    lobby.reapEmptyRooms(0);

    room.addPlayer('Ada', new FakeConnection());
    // Occupied now, so the pending reap is cancelled.
    expect(lobby.reapEmptyRooms(EMPTY_ROOM_TTL * 1000 + 1)).toBe(0);
    expect(lobby.roomCount).toBe(1);
  });
});

describe('Lobby teardown', () => {
  it('removes a room by code', () => {
    const lobby = new Lobby();
    const room = lobby.createRoom();
    lobby.removeRoom(room.code);
    expect(lobby.roomCount).toBe(0);
    expect(lobby.findRoom(room.code)).toBeUndefined();
  });

  it('ignores removal of an unknown code', () => {
    const lobby = new Lobby();
    expect(() => lobby.removeRoom('ZZZZZZ')).not.toThrow();
  });

  it('destroys every room', () => {
    const lobby = new Lobby();
    lobby.createRoom();
    lobby.createRoom();
    lobby.destroyAll();
    expect(lobby.roomCount).toBe(0);
  });

  it('lists room summaries', () => {
    const lobby = new Lobby();
    const room = lobby.createRoom();
    room.addPlayer('Ada', new FakeConnection());

    const summaries = lobby.listRooms();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.code).toBe(room.code);
    expect(summaries[0]?.playerCount).toBe(1);
    expect(summaries[0]?.isFull).toBe(false);
  });
});
