/**
 * A single 1v1 match.
 *
 * Owns the authoritative world, the fixed-timestep loop and the connection to
 * each player. Command application lives in `./commands`; broadcasting lives in
 * `./broadcast`.
 */

import type { ClientMessage, MatchPhase, PlayerId, ServerMessage } from '@fleet-strike/types';
import {
  BROADCAST_INTERVAL_TICKS,
  FIXED_DELTA,
  PLAYERS_PER_ROOM,
  TICK_INTERVAL_MS,
} from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import {
  createMatch,
  drainEvents,
  findPlanetEntity,
  forfeit,
  runSimulationTick,
} from '@fleet-strike/ecs';

import { DeltaTracker } from '../simulation/delta';
import { serializeWorld } from '../simulation/snapshot';
import { applyBuild, applyUpgrade, applyWaypoint } from './commands';
import { SiteAllocator } from './site-allocator';
import { Broadcaster } from './broadcast';
import type { PlayerConnection } from './broadcast';

export type { PlayerConnection } from './broadcast';

/** A seated player. */
export interface Seat {
  readonly id: PlayerId;
  readonly name: string;
  connection: PlayerConnection | null;
}

export class GameRoom {
  readonly code: string;
  private readonly seats = new Map<PlayerId, Seat>();
  private readonly deltas = new Map<PlayerId, DeltaTracker>();
  private readonly broadcaster: Broadcaster;
  private world: GameWorld | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly sites = new SiteAllocator();
  private lastBroadcastTick = -1;

  constructor(code: string) {
    this.code = code;
    this.broadcaster = new Broadcaster(this.seats);
  }

  get phase(): MatchPhase {
    return this.world?.context.phase ?? 'lobby';
  }

  get playerCount(): number {
    return this.seats.size;
  }

  get isFull(): boolean {
    return this.seats.size >= PLAYERS_PER_ROOM;
  }

  get isEmpty(): boolean {
    for (const seat of this.seats.values()) {
      if (seat.connection !== null && seat.connection.isOpen) return false;
    }
    return true;
  }

  /** Exposed for tests and the lobby status endpoint. */
  getWorld(): GameWorld | null {
    return this.world;
  }

  /**
   * Seats a player. Returns their id, or `null` when the room is full.
   *
   * The match starts automatically once both seats are taken.
   */
  addPlayer(name: string, connection: PlayerConnection): PlayerId | null {
    if (this.isFull) return null;

    const id: PlayerId = this.seats.has(1) ? 2 : 1;
    this.seats.set(id, { id, name, connection });
    this.deltas.set(id, new DeltaTracker());

    if (this.isFull) {
      this.start();
    } else {
      this.broadcaster.roomUpdate(this.phase);
    }

    return id;
  }

  /**
   * Removes a player.
   *
   * Leaving after the match world exists forfeits it, which is the only sane
   * resolution for a two-player game with no reconnection window in the MVP.
   * This covers the setup phase as well as active play - otherwise a player who
   * quits during the 30 second setup would leave their opponent stranded in a
   * room whose loop is still running.
   */
  removePlayer(id: PlayerId): void {
    const seat = this.seats.get(id);
    if (seat === undefined) return;

    seat.connection = null;
    const world = this.world;
    const phase = world?.context.phase;

    if (world !== null && (phase === 'playing' || phase === 'setup')) {
      const player = world.context.players.get(id);
      if (player !== undefined) player.status = 'disconnected';
      forfeit(world, id);
      this.broadcaster.matchEnded(world.context.result);
      this.stop();
      return;
    }

    this.seats.delete(id);
    this.deltas.delete(id);
    this.broadcaster.roomUpdate(this.phase);
  }

  /** Begins the match. */
  start(): void {
    if (this.world !== null) return;

    const players = [...this.seats.values()].map((seat) => ({ id: seat.id, name: seat.name }));
    this.world = createMatch({ players, seed: Date.now() & 0x7fffffff });

    const snapshot = serializeWorld(this.world);
    for (const [id, tracker] of this.deltas) {
      tracker.markFullSnapshot(this.world.context.tick, snapshot);
      this.broadcaster.sendTo(id, {
        type: 'MATCH_STARTED',
        snapshot,
        setupSeconds: this.world.context.setupRemaining,
      });
    }

    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  /** Stops the loop and releases the timer. */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Closes every connection and tears the room down. */
  destroy(): void {
    this.stop();
    for (const seat of this.seats.values()) {
      seat.connection?.close();
    }
    this.seats.clear();
    this.deltas.clear();
    this.world = null;
  }

  /**
   * Advances the simulation one tick and broadcasts when due.
   *
   * Exposed so tests can drive the loop deterministically instead of waiting on
   * a real timer.
   */
  tick(): void {
    const world = this.world;
    if (world === null) return;

    runSimulationTick(world, FIXED_DELTA);

    const events = drainEvents(world);
    if (events.length > 0) {
      this.broadcaster.gameEvents(events);
    }

    if (world.context.tick - this.lastBroadcastTick >= BROADCAST_INTERVAL_TICKS) {
      this.lastBroadcastTick = world.context.tick;
      this.broadcastState();
    }

    if (world.context.phase === 'finished') {
      this.broadcaster.matchEnded(world.context.result);
      this.stop();
    }
  }

  /** Routes a client command to its handler. */
  handleMessage(id: PlayerId, message: ClientMessage): void {
    const world = this.world;
    if (world === null) return;
    if (world.context.phase === 'finished') return;

    switch (message.type) {
      case 'SET_WAYPOINT': {
        const outcome = applyWaypoint(world, id, message.x, message.y);
        if (!outcome.ok) this.broadcaster.reject(id, outcome.reason);
        return;
      }

      case 'BUILD_STRUCTURE': {
        const outcome = applyBuild(
          world,
          id,
          message.planetIndex,
          message.moonId,
          message.buildingType,
          {
            resolvePlanetEntity: (index) => findPlanetEntity(world, index),
            resolveMoonEntity: (moonId) => this.sites.findMoonEntity(world, moonId),
            allocatePosition: (index, moonId) => this.sites.allocate(world, index, moonId),
          }
        );
        if (!outcome.ok) this.broadcaster.reject(id, outcome.reason);
        return;
      }

      case 'UPGRADE_BUILDING': {
        const outcome = applyUpgrade(world, id, message.buildingId);
        if (!outcome.ok) this.broadcaster.reject(id, outcome.reason);
        return;
      }

      default:
        return;
    }
  }

  private broadcastState(): void {
    const world = this.world;
    if (world === null) return;

    const snapshot = serializeWorld(world);

    for (const [id, tracker] of this.deltas) {
      if (tracker.shouldSendFullSnapshot(world.context.tick)) {
        tracker.markFullSnapshot(world.context.tick, snapshot);
        this.broadcaster.sendTo(id, { type: 'FULL_STATE', snapshot });
        continue;
      }
      this.broadcaster.sendTo(id, tracker.buildUpdate(snapshot) as ServerMessage);
    }
  }
}
