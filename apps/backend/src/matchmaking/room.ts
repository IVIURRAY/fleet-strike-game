/**
 * A single 1v1 match.
 *
 * Owns the authoritative world, the fixed-timestep loop and the connection to
 * each player. All state mutation from client commands funnels through here
 * after validation.
 */

import type {
  ClientMessage,
  GameEvent,
  MatchPhase,
  PlayerId,
  ServerMessage,
} from '@fleet-strike/types';
import {
  BROADCAST_INTERVAL_TICKS,
  FIXED_DELTA,
  PLANETS,
  PLAYERS_PER_ROOM,
  TICK_INTERVAL_MS,
  buildingMaxHp,
  nextUpgrade,
  productionInterval as resolveProductionInterval,
} from '@fleet-strike/config';
import type { GameWorld } from '@fleet-strike/ecs';
import {
  BuildingClass,
  Health,
  Owner,
  PlanetRef,
  Position,
  Production,
  buildingQuery,
  createBuilding,
  createMatch,
  drainEvents,
  findPlanetEntity,
  forfeit,
  orbitalQuery,
  recalculateIncome,
  runSimulationTick,
  slotPosition,
  waypointQuery,
  WaypointFollower,
} from '@fleet-strike/ecs';
import { spend } from '@fleet-strike/utils';

import { DeltaTracker } from '../simulation/delta';
import { serializeWorld } from '../simulation/snapshot';
import { validateBuild, validateUpgrade, validateWaypoint } from '../validation/commands';

/** Transport abstraction so rooms can be tested without real sockets. */
export interface PlayerConnection {
  send(message: ServerMessage): void;
  close(): void;
  readonly isOpen: boolean;
}

/** A seated player. */
interface Seat {
  readonly id: PlayerId;
  readonly name: string;
  connection: PlayerConnection | null;
}

export class GameRoom {
  readonly code: string;
  private readonly seats = new Map<PlayerId, Seat>();
  private world: GameWorld | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly deltas = new Map<PlayerId, DeltaTracker>();
  /** Next building slot index per site, so structures do not overlap. */
  private readonly slotCounters = new Map<string, number>();
  private lastBroadcastTick = -1;

  constructor(code: string) {
    this.code = code;
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

  /** Exposed for tests and for the lobby's status endpoint. */
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
      this.broadcastRoomUpdate();
    }

    return id;
  }

  /**
   * Removes a player.
   *
   * Leaving after the match world exists forfeits it, which is the only sane
   * resolution for a two-player game with no reconnection window in the MVP.
   * This covers the setup phase as well as active play — otherwise a player who
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
      this.broadcastMatchEnd();
      this.stop();
      return;
    }

    this.seats.delete(id);
    this.deltas.delete(id);
    this.broadcastRoomUpdate();
  }

  /** Begins the match. */
  start(): void {
    if (this.world !== null) return;

    const players = [...this.seats.values()].map((seat) => ({ id: seat.id, name: seat.name }));
    this.world = createMatch({ players, seed: Date.now() & 0x7fffffff });

    const snapshot = serializeWorld(this.world);
    for (const [id, tracker] of this.deltas) {
      tracker.markFullSnapshot(this.world.context.tick, snapshot);
      this.sendTo(id, {
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
      this.broadcastEvents(events);
    }

    if (world.context.tick - this.lastBroadcastTick >= BROADCAST_INTERVAL_TICKS) {
      this.lastBroadcastTick = world.context.tick;
      this.broadcastState();
    }

    if (world.context.phase === 'finished') {
      this.broadcastMatchEnd();
      this.stop();
    }
  }

  /** Applies a validated client command. */
  handleMessage(id: PlayerId, message: ClientMessage): void {
    const world = this.world;
    if (world === null) return;
    if (world.context.phase === 'finished') return;

    switch (message.type) {
      case 'SET_WAYPOINT':
        this.applyWaypoint(id, message.x, message.y);
        return;
      case 'BUILD_STRUCTURE':
        this.applyBuild(id, message.planetIndex, message.moonId, message.buildingType);
        return;
      case 'UPGRADE_BUILDING':
        this.applyUpgrade(id, message.buildingId);
        return;
      default:
        return;
    }
  }

  private applyWaypoint(id: PlayerId, x: number, y: number): void {
    const world = this.world;
    if (world === null) return;

    const result = validateWaypoint(x, y);
    if (!result.ok) {
      this.reject(id, result.reason);
      return;
    }

    const player = world.context.players.get(id);
    if (player === undefined) return;

    player.waypoint.x = result.value.x;
    player.waypoint.y = result.value.y;

    // Retarget every ship the player owns. The MVP has one waypoint per player,
    // so this is a full sweep rather than a per-group update.
    const ships = waypointQuery(world);
    for (let i = 0; i < ships.length; i += 1) {
      const eid = ships[i] as number;
      if ((Owner.playerId[eid] as number) !== id) continue;
      WaypointFollower.targetX[eid] = result.value.x;
      WaypointFollower.targetY[eid] = result.value.y;
      WaypointFollower.arrived[eid] = 0;
    }
  }

  private applyBuild(
    id: PlayerId,
    planetIndex: number,
    moonId: string | null,
    buildingType: string
  ): void {
    const world = this.world;
    if (world === null) return;

    const result = validateBuild({
      world,
      playerId: id,
      planetIndex,
      moonId,
      buildingType,
      resolvePlanetEntity: (index) => findPlanetEntity(world, index),
      resolveMoonEntity: (moon) => this.findMoonEntity(moon),
      allocatePosition: (index, moon) => this.allocatePosition(index, moon),
    });

    if (!result.ok) {
      this.reject(id, result.reason);
      return;
    }

    const player = world.context.players.get(id);
    if (player === undefined) return;
    if (!spend(player.resources, result.value.cost)) {
      this.reject(id, 'Not enough resources');
      return;
    }

    createBuilding(world, {
      type: result.value.type,
      owner: id,
      x: result.value.x,
      y: result.value.y,
      planetIndex: result.value.planetIndex,
      parentEntity: result.value.parentEntity,
      incomeMultiplier: result.value.incomeMultiplier,
      productionSpeedBonus: player.productionSpeedBonus,
    });

    player.stats.buildingsConstructed += 1;
    recalculateIncome(world);
  }

  private applyUpgrade(id: PlayerId, buildingId: number): void {
    const world = this.world;
    if (world === null) return;

    const result = validateUpgrade(world, id, buildingId);
    if (!result.ok) {
      this.reject(id, result.reason);
      return;
    }

    const player = world.context.players.get(id);
    if (player === undefined) return;
    if (!spend(player.resources, result.value.cost)) {
      this.reject(id, 'Not enough resources');
      return;
    }

    const { buildingId: eid, type, newLevel } = result.value;
    BuildingClass.level[eid] = newLevel;

    // Upgrades raise maximum HP; the building heals by the same amount so an
    // upgrade is never a temporary vulnerability.
    const previousMax = Health.max[eid] as number;
    const newMax = buildingMaxHp(type, newLevel);
    Health.max[eid] = newMax;
    Health.current[eid] = (Health.current[eid] as number) + (newMax - previousMax);

    const upgrade = nextUpgrade(type, newLevel - 1);
    if (upgrade?.productionInterval !== undefined && Production.interval[eid] !== undefined) {
      const interval = resolveProductionInterval(type, newLevel, player.productionSpeedBonus);
      Production.interval[eid] = interval;
      if ((Production.remaining[eid] as number) > interval) {
        Production.remaining[eid] = interval;
      }
    }

    // Research Labs and Manpower Centers change player-wide derived values.
    if (upgrade?.upgradeDiscount !== undefined) {
      player.upgradeDiscount = upgrade.upgradeDiscount;
    }
    if (upgrade?.productionSpeedBonus !== undefined) {
      player.productionSpeedBonus = upgrade.productionSpeedBonus;
    }
    recalculateIncome(world);
  }

  /** Allocates the next free slot position on a planet or moon. */
  private allocatePosition(planetIndex: number, moonId: string | null): { x: number; y: number } {
    const world = this.world;
    const planet = PLANETS[planetIndex];
    if (world === null || planet === undefined) return { x: 0, y: 0 };

    const key = moonId ?? `planet-${planetIndex}`;
    const slot = this.slotCounters.get(key) ?? 0;
    this.slotCounters.set(key, slot + 1);

    if (moonId === null) {
      // Offset by the buildings already present so restarts stay consistent.
      const existing = countBuildingsOnPlanetSurface(world, planetIndex);
      return slotPosition(planet.x, planet.y, planet.radius, Math.max(slot, existing));
    }

    const moonEntity = this.findMoonEntity(moonId);
    const definition = planet.moons.find((moon) => moon.id === moonId);
    if (moonEntity === 0 || definition === undefined) return { x: planet.x, y: planet.y };

    // Moon buildings sit on the moon's surface, spread across its three slots.
    const angle = (Math.PI * 2 * slot) / definition.buildingSlots;
    return {
      x: (Position.x[moonEntity] as number) + Math.cos(angle) * definition.radius * 0.6,
      y: (Position.y[moonEntity] as number) + Math.sin(angle) * definition.radius * 0.6,
    };
  }

  /** Finds a moon entity by its definition id. */
  private findMoonEntity(moonId: string): number {
    const world = this.world;
    if (world === null) return 0;

    const moons = orbitalQuery(world);
    const seenPerPlanet = new Map<number, number>();

    for (let i = 0; i < moons.length; i += 1) {
      const eid = moons[i] as number;
      const planetIndex = PlanetRef.index[eid] as number;
      const planet = PLANETS[planetIndex];
      if (planet === undefined) continue;

      const localIndex = seenPerPlanet.get(planetIndex) ?? 0;
      seenPerPlanet.set(planetIndex, localIndex + 1);

      if (planet.moons[localIndex]?.id === moonId) return eid;
    }

    return 0;
  }

  // --- Broadcasting --------------------------------------------------------

  private broadcastState(): void {
    const world = this.world;
    if (world === null) return;

    const snapshot = serializeWorld(world);

    for (const [id, tracker] of this.deltas) {
      if (tracker.shouldSendFullSnapshot(world.context.tick)) {
        tracker.markFullSnapshot(world.context.tick, snapshot);
        this.sendTo(id, { type: 'FULL_STATE', snapshot });
        continue;
      }
      this.sendTo(id, tracker.buildUpdate(snapshot));
    }
  }

  private broadcastEvents(events: readonly GameEvent[]): void {
    // Rejections are addressed to one player and are sent separately.
    const shared = events.filter((event) => event.type !== 'COMMAND_REJECTED');
    if (shared.length === 0) return;
    this.broadcast({ type: 'GAME_EVENTS', events: shared });
  }

  private broadcastRoomUpdate(): void {
    this.broadcast({
      type: 'ROOM_UPDATED',
      phase: this.phase,
      players: [...this.seats.values()].map((seat) => ({
        id: seat.id,
        name: seat.name,
        status: seat.connection !== null ? ('connected' as const) : ('disconnected' as const),
        resources: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
        income: { gold: 0, manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
        caps: { manpower: 0, crystal: 0, gas: 0, tungsten: 0 },
        waypoint: { x: 0, y: 0 },
        controlledPlanets: [],
        shipCount: 0,
      })),
    });
  }

  private broadcastMatchEnd(): void {
    const result = this.world?.context.result;
    if (result === undefined || result === null) return;
    this.broadcast({ type: 'MATCH_ENDED', result });
  }

  private reject(id: PlayerId, reason: string): void {
    this.sendTo(id, { type: 'GAME_EVENTS', events: [{ type: 'COMMAND_REJECTED', reason }] });
  }

  private broadcast(message: ServerMessage): void {
    for (const seat of this.seats.values()) {
      if (seat.connection?.isOpen === true) seat.connection.send(message);
    }
  }

  private sendTo(id: PlayerId, message: ServerMessage): void {
    const seat = this.seats.get(id);
    if (seat?.connection?.isOpen === true) seat.connection.send(message);
  }
}

/** Counts buildings on a planet's surface, excluding those on its moons. */
function countBuildingsOnPlanetSurface(world: GameWorld, planetIndex: number): number {
  const buildings = buildingQuery(world);
  let count = 0;
  for (let i = 0; i < buildings.length; i += 1) {
    const eid = buildings[i] as number;
    if ((PlanetRef.index[eid] as number) !== planetIndex) continue;
    count += 1;
  }
  return count;
}
