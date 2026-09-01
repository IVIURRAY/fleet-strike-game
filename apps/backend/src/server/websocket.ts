/**
 * WebSocket connection handling.
 *
 * Each socket owns at most one seat in one room. Command rate is throttled per
 * connection so a hostile client cannot flood the simulation.
 */

import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { ClientMessage, PlayerId, ServerMessage } from '@fleet-strike/types';
import { MAX_COMMANDS_PER_SECOND } from '@fleet-strike/config';

import type { Lobby } from '../matchmaking/lobby';
import type { GameRoom, PlayerConnection } from '../matchmaking/room';
import { parseClientMessage, sanitizeName } from './protocol';

/** Per-socket session state. */
interface Session {
  room: GameRoom | null;
  playerId: PlayerId | null;
  /** Sliding window of recent command timestamps, for rate limiting. */
  commandTimes: number[];
}

/** Wraps a `ws` socket in the transport interface rooms expect. */
function makeConnection(socket: WebSocket): PlayerConnection {
  return {
    send(message: ServerMessage): void {
      if (socket.readyState !== socket.OPEN) return;
      socket.send(JSON.stringify(message));
    },
    close(): void {
      socket.close();
    },
    get isOpen(): boolean {
      return socket.readyState === socket.OPEN;
    },
  };
}

/** Attaches a WebSocket server to an existing HTTP server. */
export function createWebSocketServer(server: Server, lobby: Lobby): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    const session: Session = { room: null, playerId: null, commandTimes: [] };
    const connection = makeConnection(socket);

    socket.on('message', (data: unknown) => {
      const raw = typeof data === 'string' ? data : String(data);
      const parsed = parseClientMessage(raw);

      if (!parsed.ok) {
        connection.send({ type: 'ERROR', code: 'BAD_MESSAGE', message: parsed.reason });
        return;
      }

      if (!allowCommand(session)) {
        connection.send({
          type: 'ERROR',
          code: 'RATE_LIMITED',
          message: 'Too many commands, slow down',
        });
        return;
      }

      handleMessage(session, connection, lobby, parsed.message);
    });

    socket.on('close', () => {
      if (session.room !== null && session.playerId !== null) {
        session.room.removePlayer(session.playerId);
      }
      session.room = null;
      session.playerId = null;
    });

    socket.on('error', () => {
      // Errors are followed by a close event, which performs the cleanup.
    });
  });

  return wss;
}

/** Enforces the documented command rate limit. */
function allowCommand(session: Session): boolean {
  const now = Date.now();
  const cutoff = now - 1000;

  // Drop timestamps outside the one second window.
  let write = 0;
  for (let i = 0; i < session.commandTimes.length; i += 1) {
    const time = session.commandTimes[i] as number;
    if (time > cutoff) {
      session.commandTimes[write] = time;
      write += 1;
    }
  }
  session.commandTimes.length = write;

  if (session.commandTimes.length >= MAX_COMMANDS_PER_SECOND) return false;

  session.commandTimes.push(now);
  return true;
}

/** Routes a validated message to the lobby or the player's room. */
function handleMessage(
  session: Session,
  connection: PlayerConnection,
  lobby: Lobby,
  message: ClientMessage
): void {
  switch (message.type) {
    case 'CREATE_ROOM': {
      if (session.room !== null) {
        connection.send({
          type: 'ERROR',
          code: 'ALREADY_IN_ROOM',
          message: 'Leave your current room first',
        });
        return;
      }

      const room = lobby.createRoom();
      const playerId = room.addPlayer(sanitizeName(message.playerName), connection);
      if (playerId === null) {
        connection.send({ type: 'ERROR', code: 'ROOM_FULL', message: 'Room is full' });
        return;
      }

      session.room = room;
      session.playerId = playerId;
      connection.send({ type: 'ROOM_CREATED', code: room.code, playerId });
      return;
    }

    case 'JOIN_ROOM': {
      if (session.room !== null) {
        connection.send({
          type: 'ERROR',
          code: 'ALREADY_IN_ROOM',
          message: 'Leave your current room first',
        });
        return;
      }

      const room = lobby.findRoom(message.code);
      if (room === undefined) {
        connection.send({ type: 'ERROR', code: 'NO_SUCH_ROOM', message: 'No room with that code' });
        return;
      }
      if (room.isFull) {
        connection.send({ type: 'ERROR', code: 'ROOM_FULL', message: 'That room is full' });
        return;
      }

      const playerId = room.addPlayer(sanitizeName(message.playerName), connection);
      if (playerId === null) {
        connection.send({ type: 'ERROR', code: 'ROOM_FULL', message: 'That room is full' });
        return;
      }

      session.room = room;
      session.playerId = playerId;
      connection.send({
        type: 'ROOM_JOINED',
        code: room.code,
        playerId,
        players: [],
      });
      return;
    }

    case 'LEAVE_ROOM': {
      if (session.room !== null && session.playerId !== null) {
        session.room.removePlayer(session.playerId);
      }
      session.room = null;
      session.playerId = null;
      return;
    }

    case 'PING': {
      connection.send({ type: 'PONG', sentAt: message.sentAt });
      return;
    }

    default: {
      // In-match commands require a seat.
      if (session.room === null || session.playerId === null) {
        connection.send({ type: 'ERROR', code: 'NOT_IN_ROOM', message: 'Join a room first' });
        return;
      }
      session.room.handleMessage(session.playerId, message);
      return;
    }
  }
}
