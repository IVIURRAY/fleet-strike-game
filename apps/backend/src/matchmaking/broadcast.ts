/**
 * Outbound message fan-out for a room.
 *
 * Split from `GameRoom` so the room does not also own message shaping. Keeps the
 * distinction between "everyone in the room" and "one specific player" explicit,
 * which matters because command rejections must never leak to the opponent.
 */

import type {
  GameEvent,
  MatchPhase,
  MatchResult,
  PlayerId,
  ServerMessage,
} from '@fleet-strike/types';

/** Transport abstraction so rooms can be tested without real sockets. */
export interface PlayerConnection {
  send(message: ServerMessage): void;
  close(): void;
  readonly isOpen: boolean;
}

/** Minimal seat shape the broadcaster needs. */
interface SeatLike {
  readonly id: PlayerId;
  readonly name: string;
  connection: PlayerConnection | null;
}

export class Broadcaster {
  constructor(private readonly seats: Map<PlayerId, SeatLike>) {}

  /** Sends to every connected player. */
  all(message: ServerMessage): void {
    for (const seat of this.seats.values()) {
      if (seat.connection?.isOpen === true) seat.connection.send(message);
    }
  }

  /** Sends to a single player. */
  sendTo(id: PlayerId, message: ServerMessage): void {
    const seat = this.seats.get(id);
    if (seat?.connection?.isOpen === true) seat.connection.send(message);
  }

  /** Notifies one player that their command was refused. */
  reject(id: PlayerId, reason: string): void {
    this.sendTo(id, { type: 'GAME_EVENTS', events: [{ type: 'COMMAND_REJECTED', reason }] });
  }

  /** Broadcasts shared world events, excluding player-specific rejections. */
  gameEvents(events: readonly GameEvent[]): void {
    const shared = events.filter((event) => event.type !== 'COMMAND_REJECTED');
    if (shared.length === 0) return;
    this.all({ type: 'GAME_EVENTS', events: shared });
  }

  /** Broadcasts lobby membership. */
  roomUpdate(phase: MatchPhase): void {
    this.all({
      type: 'ROOM_UPDATED',
      phase,
      players: [...this.seats.values()].map((seat) => ({
        id: seat.id,
        name: seat.name,
        status: seat.connection !== null ? ('connected' as const) : ('disconnected' as const),
        // The lobby view carries no gameplay state; the match snapshot does.
        resources: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
        income: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
        caps: { manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
        waypoint: { x: 0, y: 0 },
        controlledPlanets: [],
        shipCount: 0,
      })),
    });
  }

  /** Broadcasts the final result. */
  matchEnded(result: MatchResult | null | undefined): void {
    if (result === null || result === undefined) return;
    this.all({ type: 'MATCH_ENDED', result });
  }
}
