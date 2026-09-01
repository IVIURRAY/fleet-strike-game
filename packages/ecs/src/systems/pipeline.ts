/**
 * The system pipeline.
 *
 * The design docs give three mutually inconsistent orderings. This is the
 * reconciled order, chosen so that each system reads data the previous one has
 * already made current:
 *
 *  1. spatialIndex  - rebuild the broad-phase index before anything queries it
 *  2. moonOrbit     - moons move before turrets on them pick targets
 *  3. waypointNav   - set desired velocity
 *  4. movement      - integrate that velocity
 *  5. targeting     - acquire targets against post-move positions
 *  6. combat        - fire weapons (ships and turrets share this system)
 *  7. guidance      - steer homing munitions
 *  8. projectileMove- integrate projectiles
 *  9. collision     - resolve impacts over the swept path
 * 10. repair        - Medic beams and Repair Station auras
 * 11. shieldRegen   - shields recover after their delay
 * 12. lifetime      - expire projectiles and effects
 * 13. health        - flag anything at zero HP
 * 14. removal       - apply deferred destruction
 *
 * Economy, production, capture and victory run on a one-second cadence, matching
 * the docs' "Every 1 second" group.
 *
 * Note that waypoint navigation runs *before* movement, unlike the docs'
 * priority list. Running it after would apply this tick's steering on the next
 * tick, adding a frame of input lag for no benefit.
 */

import { FIXED_DELTA, SLOW_SYSTEM_INTERVAL } from '@fleet-strike/config';

import { captureSystem, updatePlanetControl } from './capture';
import { combatSystem } from './combat';
import { economySystem } from './economy';
import { healthSystem, removalSystem } from './health';
import { lifetimeSystem } from './lifetime';
import { movementSystem } from './movement';
import { moonOrbitSystem } from './orbit';
import { constructionSystem, productionSystem } from './production';
import { projectileCollisionSystem, projectileGuidanceSystem } from './projectile';
import { repairSystem } from './repair';
import { shieldRegenSystem } from './damage';
import { spatialIndexSystem } from './spatial-index';
import { targetingSystem } from './targeting';
import { victorySystem } from './victory';
import { waypointNavigationSystem } from './waypoint';
import type { GameWorld } from '../world';

/**
 * Advances the simulation by one fixed tick.
 *
 * `deltaTime` defaults to the fixed timestep; tests may pass a different value
 * to fast-forward, but the server always uses the fixed step so the simulation
 * stays deterministic.
 */
export function runSimulationTick(world: GameWorld, deltaTime: number = FIXED_DELTA): void {
  const { context } = world;

  if (context.phase === 'finished') return;

  if (context.phase === 'setup') {
    context.setupRemaining -= deltaTime;
    if (context.setupRemaining <= 0) {
      context.phase = 'playing';
      context.setupRemaining = 0;
    }
    // The setup phase still advances the clock and the economy so players start
    // with the income the docs describe, but no combat occurs. The spatial
    // index is refreshed because the economy reads the cached planet list.
    spatialIndexSystem(world);
    updatePlanetControl(world);
    context.elapsed += deltaTime;
    context.tick += 1;
    runSlowSystems(world, deltaTime);
    return;
  }

  if (context.phase !== 'playing') return;

  spatialIndexSystem(world);
  moonOrbitSystem(world, deltaTime);
  waypointNavigationSystem(world, deltaTime);
  movementSystem(world, deltaTime);
  targetingSystem(world, deltaTime);
  combatSystem(world, deltaTime);
  projectileGuidanceSystem(world, deltaTime);
  projectileCollisionSystem(world, deltaTime);
  repairSystem(world, deltaTime);
  shieldRegenSystem(world, deltaTime);
  lifetimeSystem(world, deltaTime);
  healthSystem(world);
  removalSystem(world);

  context.elapsed += deltaTime;
  context.tick += 1;

  runSlowSystems(world, deltaTime);
}

/** Runs the one-second cadence systems when enough time has accumulated. */
function runSlowSystems(world: GameWorld, deltaTime: number): void {
  const { context } = world;
  context.slowAccumulator += deltaTime;
  if (context.slowAccumulator < SLOW_SYSTEM_INTERVAL) return;

  const step = context.slowAccumulator;
  context.slowAccumulator = 0;

  constructionSystem(world, step);

  if (context.phase === 'playing') {
    captureSystem(world, step);
    updatePlanetControl(world);
    productionSystem(world, step);
  }

  economySystem(world, step);

  if (context.phase === 'playing') {
    victorySystem(world);
  }
}
