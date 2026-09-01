/**
 * Client game state.
 *
 * The server is authoritative, so this is a passive mirror: it applies full
 * snapshots and deltas and never simulates gameplay. Ships keep both their last
 * two server positions so the renderer can interpolate between 30 Hz updates and
 * still present smooth motion at 60 FPS.
 */

import type {
  BuildingState,
  MatchPhase,
  MatchResult,
  MoonState,
  PlanetState,
  PlayerId,
  PlayerView,
  ProjectileSnapshot,
  ShipSnapshot,
  StateUpdateMessage,
  WorldSnapshot,
} from '@fleet-strike/types';

/** A ship as tracked on the client, with interpolation endpoints. */
export interface ClientShip {
  id: number;
  type: number;
  owner: PlayerId;
  /** Previous server position, the interpolation start. */
  prevX: number;
  prevY: number;
  prevRotation: number;
  /** Latest server position, the interpolation target. */
  x: number;
  y: number;
  rotation: number;
  hp: number;
  maxHp: number;
  /** Seconds since the last server update for this ship. */
  age: number;
}

export class GameStore {
  /** Which player this client controls. `null` until a room is joined. */
  playerId: PlayerId | null = null;
  roomCode: string | null = null;
  phase: MatchPhase = 'lobby';
  tick = 0;
  elapsed = 0;
  setupRemaining = 0;
  result: MatchResult | null = null;

  readonly ships = new Map<number, ClientShip>();
  projectiles: readonly ProjectileSnapshot[] = [];
  planets: readonly PlanetState[] = [];
  moons: readonly MoonState[] = [];
  buildings: readonly BuildingState[] = [];
  players: readonly PlayerView[] = [];

  /** Seconds between the last two server updates, used to pace interpolation. */
  private updateInterval = 1 / 30;
  private lastUpdateAt = 0;

  /** The local player's view, or `null` before the match starts. */
  get me(): PlayerView | null {
    if (this.playerId === null) return null;
    return this.players.find((player) => player.id === this.playerId) ?? null;
  }

  /** The opponent's view, or `null`. */
  get opponent(): PlayerView | null {
    if (this.playerId === null) return null;
    return this.players.find((player) => player.id !== this.playerId) ?? null;
  }

  /** Replaces all state from an authoritative snapshot. */
  applySnapshot(snapshot: WorldSnapshot): void {
    this.tick = snapshot.tick;
    this.elapsed = snapshot.elapsed;
    this.phase = snapshot.phase;
    this.result = snapshot.result;
    this.planets = snapshot.planets;
    this.moons = snapshot.moons;
    this.buildings = snapshot.buildings;
    this.players = snapshot.players;
    this.projectiles = snapshot.projectiles;

    // Reconcile rather than clear, so ships that persist keep their
    // interpolation history and do not visibly snap on every full snapshot.
    const seen = new Set<number>();
    for (const ship of snapshot.ships) {
      seen.add(ship.id);
      this.upsertShip(ship);
    }
    for (const id of [...this.ships.keys()]) {
      if (!seen.has(id)) this.ships.delete(id);
    }

    this.noteUpdate();
  }

  /** Applies an incremental update. */
  applyUpdate(update: StateUpdateMessage): void {
    this.tick = update.tick;
    this.elapsed = update.elapsed;
    this.planets = update.planets;
    this.buildings = update.buildings;
    this.players = update.players;
    this.projectiles = update.projectiles;

    for (const ship of update.created) {
      this.upsertShip(ship);
    }

    for (const entity of update.entities) {
      const ship = this.ships.get(entity.id);
      if (ship === undefined) continue;

      ship.prevX = ship.x;
      ship.prevY = ship.y;
      ship.prevRotation = ship.rotation;

      if (entity.x !== undefined) ship.x = entity.x;
      if (entity.y !== undefined) ship.y = entity.y;
      if (entity.rotation !== undefined) ship.rotation = entity.rotation;
      if (entity.hp !== undefined) ship.hp = entity.hp;
      ship.age = 0;
    }

    for (const id of update.removed) {
      this.ships.delete(id);
    }

    this.noteUpdate();
  }

  /** Advances interpolation ages. Called once per rendered frame. */
  advance(deltaTime: number): void {
    for (const ship of this.ships.values()) {
      ship.age += deltaTime;
    }
  }

  /**
   * Interpolation factor in [0, 1] for the current frame.
   *
   * Clamped so a late packet holds the ship at its last known position rather
   * than extrapolating it into a wall.
   */
  interpolationFactor(ship: ClientShip): number {
    if (this.updateInterval <= 0) return 1;
    const t = ship.age / this.updateInterval;
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  /** Planet state by chain index. */
  planetAt(index: number): PlanetState | undefined {
    return this.planets.find((planet) => planet.index === index);
  }

  /** Buildings sitting on a given planet, including its moons. */
  buildingsOnPlanet(index: number): BuildingState[] {
    return this.buildings.filter((building) => building.planetIndex === index);
  }

  /** True when the local player controls the given planet. */
  controlsPlanet(index: number): boolean {
    return this.planetAt(index)?.owner === this.playerId;
  }

  /** Clears all match state, returning to the lobby. */
  reset(): void {
    this.phase = 'lobby';
    this.tick = 0;
    this.elapsed = 0;
    this.setupRemaining = 0;
    this.result = null;
    this.ships.clear();
    this.projectiles = [];
    this.planets = [];
    this.moons = [];
    this.buildings = [];
    this.players = [];
  }

  private upsertShip(snapshot: ShipSnapshot): void {
    const existing = this.ships.get(snapshot.id);

    if (existing === undefined) {
      this.ships.set(snapshot.id, {
        id: snapshot.id,
        type: snapshot.type,
        owner: snapshot.owner,
        prevX: snapshot.x,
        prevY: snapshot.y,
        prevRotation: snapshot.rotation,
        x: snapshot.x,
        y: snapshot.y,
        rotation: snapshot.rotation,
        hp: snapshot.hp,
        maxHp: snapshot.maxHp,
        age: 0,
      });
      return;
    }

    existing.prevX = existing.x;
    existing.prevY = existing.y;
    existing.prevRotation = existing.rotation;
    existing.x = snapshot.x;
    existing.y = snapshot.y;
    existing.rotation = snapshot.rotation;
    existing.hp = snapshot.hp;
    existing.maxHp = snapshot.maxHp;
    existing.age = 0;
  }

  /** Measures the real interval between updates so interpolation matches it. */
  private noteUpdate(): void {
    const now = performance.now() / 1000;
    if (this.lastUpdateAt > 0) {
      const delta = now - this.lastUpdateAt;
      // Ignore absurd gaps from tab suspension.
      if (delta > 0.001 && delta < 1) {
        // Smooth the estimate so one late packet does not jerk everything.
        this.updateInterval = this.updateInterval * 0.8 + delta * 0.2;
      }
    }
    this.lastUpdateAt = now;
  }
}
