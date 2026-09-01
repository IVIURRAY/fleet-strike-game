import { beforeEach, describe, expect, it } from 'vitest';

import { PLANETS, SETUP_DURATION, TICK_RATE } from '@fleet-strike/config';
import type { ServerMessage } from '@fleet-strike/types';
import { serializeBuildings } from '../simulation/snapshot';
import { GameRoom } from './room';
import type { PlayerConnection } from './room';

/** Records everything the server sends, so tests can assert on the protocol. */
class FakeConnection implements PlayerConnection {
  readonly sent: ServerMessage[] = [];
  private open = true;

  send(message: ServerMessage): void {
    this.sent.push(message);
  }

  close(): void {
    this.open = false;
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** All messages of a given type. */
  ofType<T extends ServerMessage['type']>(type: T): Array<Extract<ServerMessage, { type: T }>> {
    return this.sent.filter((m) => m.type === type) as Array<Extract<ServerMessage, { type: T }>>;
  }

  /** Rejection reasons received via GAME_EVENTS. */
  rejections(): string[] {
    const reasons: string[] = [];
    for (const message of this.sent) {
      if (message.type !== 'GAME_EVENTS') continue;
      for (const event of message.events) {
        if (event.type === 'COMMAND_REJECTED') reasons.push(event.reason);
      }
    }
    return reasons;
  }
}

/** Advances a room by `seconds` of simulated time. */
function advance(room: GameRoom, seconds: number): void {
  const ticks = Math.round(seconds * TICK_RATE);
  for (let i = 0; i < ticks; i += 1) room.tick();
}

describe('GameRoom seating', () => {
  let room: GameRoom;

  beforeEach(() => {
    room = new GameRoom('ABCDEF');
  });

  it('starts in the lobby phase', () => {
    expect(room.phase).toBe('lobby');
    expect(room.playerCount).toBe(0);
    expect(room.isFull).toBe(false);
  });

  it('seats the first player as player 1', () => {
    expect(room.addPlayer('Ada', new FakeConnection())).toBe(1);
  });

  it('seats the second player as player 2 and starts the match', () => {
    room.addPlayer('Ada', new FakeConnection());
    const second = new FakeConnection();
    expect(room.addPlayer('Grace', second)).toBe(2);

    expect(room.isFull).toBe(true);
    expect(room.phase).toBe('setup');
    expect(second.ofType('MATCH_STARTED')).toHaveLength(1);
    room.stop();
  });

  it('refuses a third player', () => {
    room.addPlayer('A', new FakeConnection());
    room.addPlayer('B', new FakeConnection());
    expect(room.addPlayer('C', new FakeConnection())).toBeNull();
    room.stop();
  });

  it('sends the initial snapshot with both fleets and the full map', () => {
    room.addPlayer('A', new FakeConnection());
    const second = new FakeConnection();
    room.addPlayer('B', second);

    const started = second.ofType('MATCH_STARTED')[0];
    expect(started).toBeDefined();
    const snapshot = started!.snapshot;

    expect(snapshot.planets).toHaveLength(PLANETS.length);
    expect(snapshot.moons).toHaveLength(16);
    // 5 scouts + 3 soldiers each.
    expect(snapshot.ships).toHaveLength(16);
    // One Command Center per player.
    expect(snapshot.buildings).toHaveLength(2);
    expect(snapshot.players).toHaveLength(2);
    room.stop();
  });

  it('reports emptiness once every connection closes', () => {
    const first = new FakeConnection();
    room.addPlayer('A', first);
    expect(room.isEmpty).toBe(false);
    first.close();
    expect(room.isEmpty).toBe(true);
  });
});

describe('GameRoom simulation', () => {
  let room: GameRoom;
  let p1: FakeConnection;
  let p2: FakeConnection;

  beforeEach(() => {
    room = new GameRoom('ABCDEF');
    p1 = new FakeConnection();
    p2 = new FakeConnection();
    room.addPlayer('Ada', p1);
    room.addPlayer('Grace', p2);
    // The constructor started a real timer; drive it manually instead.
    room.stop();
  });

  it('leaves setup for playing after the setup phase', () => {
    expect(room.phase).toBe('setup');
    advance(room, SETUP_DURATION + 1);
    expect(room.phase).toBe('playing');
  });

  it('broadcasts state updates to both players', () => {
    advance(room, 1);
    expect(p1.ofType('STATE_UPDATE').length + p1.ofType('FULL_STATE').length).toBeGreaterThan(0);
    expect(p2.ofType('STATE_UPDATE').length + p2.ofType('FULL_STATE').length).toBeGreaterThan(0);
  });

  it('broadcasts at roughly the configured rate', () => {
    advance(room, 1);
    const broadcasts = p1.ofType('STATE_UPDATE').length + p1.ofType('FULL_STATE').length;
    // 30 Hz, allowing a little slack for the interval arithmetic.
    expect(broadcasts).toBeGreaterThanOrEqual(25);
    expect(broadcasts).toBeLessThanOrEqual(35);
  });

  it('sends periodic full snapshots as delta baselines', () => {
    advance(room, 12);
    expect(p1.ofType('FULL_STATE').length).toBeGreaterThanOrEqual(1);
  });
});

describe('GameRoom commands', () => {
  let room: GameRoom;
  let p1: FakeConnection;

  beforeEach(() => {
    room = new GameRoom('ABCDEF');
    p1 = new FakeConnection();
    room.addPlayer('Ada', p1);
    room.addPlayer('Grace', new FakeConnection());
    room.stop();
    advance(room, SETUP_DURATION + 1);
  });

  it('moves the waypoint and retargets the fleet', () => {
    room.handleMessage(1, { type: 'SET_WAYPOINT', x: 9000, y: 3000 });

    const world = room.getWorld();
    expect(world?.context.players.get(1)?.waypoint).toEqual({ x: 9000, y: 3000 });
    expect(p1.rejections()).toHaveLength(0);
  });

  it('rejects a waypoint outside the map', () => {
    room.handleMessage(1, { type: 'SET_WAYPOINT', x: -500, y: 3000 });
    expect(p1.rejections().join(' ')).toMatch(/outside the map/i);
  });

  it('builds a factory and charges for it', () => {
    const world = room.getWorld()!;
    const before = world.context.players.get(1)!.resources.gold;

    room.handleMessage(1, {
      type: 'BUILD_STRUCTURE',
      planetIndex: 0,
      moonId: null,
      buildingType: 'scoutFactory',
    });

    expect(p1.rejections()).toHaveLength(0);
    expect(world.context.players.get(1)!.resources.gold).toBeCloseTo(before - 50, 4);
    expect(world.context.players.get(1)!.stats.buildingsConstructed).toBe(1);
  });

  it('rejects building on an enemy planet', () => {
    room.handleMessage(1, {
      type: 'BUILD_STRUCTURE',
      planetIndex: 6,
      moonId: null,
      buildingType: 'scoutFactory',
    });
    expect(p1.rejections().join(' ')).toMatch(/do not control/i);
  });

  it('rejects an unaffordable build', () => {
    const world = room.getWorld()!;
    world.context.players.get(1)!.resources.gold = 0;

    room.handleMessage(1, {
      type: 'BUILD_STRUCTURE',
      planetIndex: 0,
      moonId: null,
      buildingType: 'heavyFactory',
    });
    expect(p1.rejections().join(' ')).toMatch(/not enough/i);
  });

  it('spawns ships from a completed factory', () => {
    const world = room.getWorld()!;
    world.context.players.get(1)!.resources.gold = 5000;

    room.handleMessage(1, {
      type: 'BUILD_STRUCTURE',
      planetIndex: 0,
      moonId: null,
      buildingType: 'scoutFactory',
    });

    const before = world.context.players.get(1)!.stats.shipsProduced;
    // 30 seconds to build, then a 45 second production cycle.
    advance(room, 80);
    expect(world.context.players.get(1)!.stats.shipsProduced).toBeGreaterThan(before);
  });

  it('upgrades a building and raises its max hp', () => {
    const world = room.getWorld()!;
    world.context.players.get(1)!.resources.gold = 5000;

    room.handleMessage(1, {
      type: 'BUILD_STRUCTURE',
      planetIndex: 0,
      moonId: null,
      buildingType: 'goldMine',
    });
    advance(room, 35);

    const buildings = snapshotBuildings(room);
    const goldMine = buildings.find((b) => b.type === 'goldMine');
    expect(goldMine).toBeDefined();

    room.handleMessage(1, { type: 'UPGRADE_BUILDING', buildingId: goldMine!.id });
    expect(p1.rejections()).toHaveLength(0);

    const after = snapshotBuildings(room).find((b) => b.id === goldMine!.id);
    expect(after?.level).toBe(2);
    expect(after?.hp).toBeGreaterThanOrEqual(goldMine!.hp);
  });

  it('ignores commands once the match is finished', () => {
    const world = room.getWorld()!;
    world.context.phase = 'finished';

    room.handleMessage(1, { type: 'SET_WAYPOINT', x: 9000, y: 3000 });
    expect(world.context.players.get(1)?.waypoint.x).not.toBe(9000);
  });
});

describe('GameRoom disconnection', () => {
  it('forfeits an in-progress match when a player leaves', () => {
    const room = new GameRoom('ABCDEF');
    const p1 = new FakeConnection();
    const p2 = new FakeConnection();
    room.addPlayer('Ada', p1);
    room.addPlayer('Grace', p2);
    room.stop();
    advance(room, SETUP_DURATION + 1);

    room.removePlayer(1);

    const ended = p2.ofType('MATCH_ENDED')[0];
    expect(ended).toBeDefined();
    expect(ended!.result.winner).toBe(2);
    expect(ended!.result.reason).toBe('forfeit');
  });

  it('forfeits when a player leaves during the setup phase', () => {
    // Quitting before the match goes live must still end it, otherwise the
    // remaining player is stranded in a room whose loop is still ticking.
    const room = new GameRoom('ABCDEF');
    const p1 = new FakeConnection();
    const p2 = new FakeConnection();
    room.addPlayer('Ada', p1);
    room.addPlayer('Grace', p2);
    room.stop();

    expect(room.phase).toBe('setup');
    room.removePlayer(1);

    const ended = p2.ofType('MATCH_ENDED')[0];
    expect(ended).toBeDefined();
    expect(ended!.result.winner).toBe(2);
    expect(ended!.result.reason).toBe('forfeit');
    expect(room.phase).toBe('finished');
  });

  it('just frees the seat when a player leaves the lobby', () => {
    const room = new GameRoom('ABCDEF');
    room.addPlayer('Ada', new FakeConnection());
    room.removePlayer(1);
    expect(room.playerCount).toBe(0);
    expect(room.isFull).toBe(false);
  });

  it('broadcasts the result when the match ends', () => {
    const room = new GameRoom('ABCDEF');
    const p1 = new FakeConnection();
    room.addPlayer('Ada', p1);
    room.addPlayer('Grace', new FakeConnection());
    room.stop();

    const world = room.getWorld()!;
    world.context.phase = 'playing';
    world.context.elapsed = 60 * 60;

    advance(room, 2);
    expect(p1.ofType('MATCH_ENDED').length).toBeGreaterThanOrEqual(1);
  });
});

/** Reads the buildings out of a fresh snapshot. */
function snapshotBuildings(room: GameRoom) {
  const world = room.getWorld();
  if (world === null) return [];
  return serializeBuildings(world);
}
