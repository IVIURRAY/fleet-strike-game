import { beforeEach, describe, expect, it } from 'vitest';
import { addComponent, addEntity } from 'bitecs';

import {
  Active,
  Owner,
  Position,
  Rotation,
  ShipTag,
  Velocity,
  WaypointFollower,
} from '../components';
import { movementSystem } from './movement';
import { waypointNavigationSystem } from './waypoint';
import { createGameWorld } from '../world';
import type { GameWorld } from '../world';
import { createShip } from '../entities/ship';
import { spatialIndexSystem } from './spatial-index';

describe('movementSystem', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('updates position based on velocity', () => {
    const ship = addEntity(world);
    addComponent(world, ShipTag, ship);
    addComponent(world, Active, ship);
    addComponent(world, Position, ship);
    addComponent(world, Velocity, ship);
    addComponent(world, Owner, ship);

    Position.x[ship] = 100;
    Position.y[ship] = 100;
    Velocity.dx[ship] = 10;
    Velocity.dy[ship] = 5;

    movementSystem(world, 1);

    expect(Position.x[ship]).toBeCloseTo(110, 4);
    expect(Position.y[ship]).toBeCloseTo(105, 4);
  });

  it('scales movement by delta time', () => {
    const ship = makeShip(world, 0, 0, 60, 0);
    movementSystem(world, 0.5);
    expect(Position.x[ship]).toBeCloseTo(30, 4);
  });

  it('clamps ships to the world bounds', () => {
    const ship = makeShip(world, 10, 10, -10000, -10000);
    movementSystem(world, 1);
    expect(Position.x[ship]).toBe(0);
    expect(Position.y[ship]).toBe(0);
  });

  it('leaves stationary entities alone', () => {
    const ship = makeShip(world, 500, 500, 0, 0);
    movementSystem(world, 1);
    expect(Position.x[ship]).toBe(500);
    expect(Position.y[ship]).toBe(500);
  });
});

describe('waypointNavigationSystem', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld(1);
  });

  it('steers a ship toward its waypoint', () => {
    const ship = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 1000,
      y: 3000,
      rotation: 0,
      waypointX: 4000,
      waypointY: 3000,
    });
    spatialIndexSystem(world);

    waypointNavigationSystem(world, 1 / 60);

    // Already facing the waypoint, so it should accelerate straight toward it.
    expect(Velocity.dx[ship]).toBeGreaterThan(0);
    expect(Math.abs(Velocity.dy[ship] as number)).toBeLessThan(1);
  });

  it('closes the distance to the waypoint over time', () => {
    const ship = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 1000,
      y: 3000,
      rotation: 0,
      waypointX: 4000,
      waypointY: 3000,
    });

    // A 220 u/s Scout crosses a 3000 unit lane in ~13.6 seconds, which matches
    // the travel time quoted in docs/Map_Design.md. Run 15 seconds.
    for (let i = 0; i < 900; i += 1) {
      spatialIndexSystem(world);
      waypointNavigationSystem(world, 1 / 60);
      movementSystem(world, 1 / 60);
    }

    expect(Position.x[ship]).toBeGreaterThan(3700);
    expect(WaypointFollower.arrived[ship]).toBe(1);
  });

  it('matches the documented lane travel time for a scout', () => {
    const ship = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 0,
      y: 3000,
      rotation: 0,
      waypointX: 18000,
      waypointY: 3000,
    });

    // 10 seconds of unobstructed travel at 220 u/s.
    for (let i = 0; i < 600; i += 1) {
      spatialIndexSystem(world);
      waypointNavigationSystem(world, 1 / 60);
      movementSystem(world, 1 / 60);
    }

    expect(Position.x[ship]).toBeCloseTo(2200, -2);
  });

  it('respects the turn rate rather than snapping to the target heading', () => {
    const ship = createShip(world, {
      type: 'heavy',
      owner: 1,
      x: 3000,
      y: 3000,
      // Facing right, waypoint is to the left, so it must turn 180 degrees.
      rotation: 0,
      waypointX: 1000,
      waypointY: 3000,
    });
    spatialIndexSystem(world);

    waypointNavigationSystem(world, 1 / 60);

    // A Heavy turns at 90 deg/s, so one tick is at most 1.5 degrees.
    const angle = Math.abs(Rotation.angle[ship] as number);
    expect(angle).toBeLessThan((2 * Math.PI) / 180);
    expect(angle).toBeGreaterThan(0);
  });

  it('loiters near the waypoint instead of stopping', () => {
    const ship = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 3000,
      y: 3000,
      waypointX: 3000,
      waypointY: 3000,
    });
    spatialIndexSystem(world);
    waypointNavigationSystem(world, 1 / 60);

    expect(WaypointFollower.arrived[ship]).toBe(1);
    const speed = Math.hypot(Velocity.dx[ship] as number, Velocity.dy[ship] as number);
    // Ships never come to a full stop.
    expect(speed).toBeGreaterThan(0);
  });

  it('pushes co-located ships apart', () => {
    const a = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 3000,
      y: 3000,
      waypointX: 3000,
      waypointY: 3000,
    });
    const b = createShip(world, {
      type: 'scout',
      owner: 1,
      x: 3000,
      y: 3000,
      waypointX: 3000,
      waypointY: 3000,
    });

    for (let i = 0; i < 120; i += 1) {
      spatialIndexSystem(world);
      waypointNavigationSystem(world, 1 / 60);
      movementSystem(world, 1 / 60);
    }

    const separation = Math.hypot(
      (Position.x[a] as number) - (Position.x[b] as number),
      (Position.y[a] as number) - (Position.y[b] as number)
    );
    expect(separation).toBeGreaterThan(1);
  });
});

function makeShip(world: GameWorld, x: number, y: number, dx: number, dy: number): number {
  const ship = addEntity(world);
  addComponent(world, ShipTag, ship);
  addComponent(world, Active, ship);
  addComponent(world, Position, ship);
  addComponent(world, Velocity, ship);
  addComponent(world, Owner, ship);
  Position.x[ship] = x;
  Position.y[ship] = y;
  Velocity.dx[ship] = dx;
  Velocity.dy[ship] = dy;
  return ship;
}
