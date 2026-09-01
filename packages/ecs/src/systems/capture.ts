/**
 * Planet capture — the tug-of-war system.
 *
 * Every ship inside a planet's capture radius contributes points; Engineers
 * contribute double. The signed capture bar runs from -CAPTURE_THRESHOLD
 * (player 1 holds it) to +CAPTURE_THRESHOLD (player 2 holds it).
 *
 * The net rate is clamped to MAX_CAPTURE_RATE. Without that clamp the
 * documented 1 point/ship/second against a 100-point bar lets a 200-ship fleet
 * flip a planet in half a second, which contradicts the docs' own pacing
 * targets of multi-minute sieges.
 */

import { hasComponent } from 'bitecs';
import type { OwnerId, PlayerId } from '@fleet-strike/types';
import { CAPTURE_DECAY_RATE, CAPTURE_THRESHOLD, MAX_CAPTURE_RATE } from '@fleet-strike/config';

import {
  Capturable,
  CaptureContributor,
  Owner,
  Parent,
  PlanetRef,
  Position,
  Production,
} from '../components';
import { buildingQuery, orbitalQuery } from '../queries';
import { emitEvent } from '../world';
import type { GameWorld } from '../world';

/** Advances the capture bar on every planet and transfers ownership. */
export function captureSystem(world: GameWorld, deltaTime: number): void {
  const { shipGrid, planetEntities } = world.context;

  for (let i = 0; i < planetEntities.length; i += 1) {
    const planet = planetEntities[i] as number;

    const x = Position.x[planet] as number;
    const y = Position.y[planet] as number;
    const radius = Capturable.radius[planet] as number;
    const radiusSquared = radius * radius;

    let rateP1 = 0;
    let rateP2 = 0;
    let countP1 = 0;
    let countP2 = 0;

    const nearby = shipGrid.query(x, y, radius);
    for (let j = 0; j < nearby.length; j += 1) {
      const ship = nearby[j] as number;
      if (!hasComponent(world, CaptureContributor, ship)) continue;

      const dx = (Position.x[ship] as number) - x;
      const dy = (Position.y[ship] as number) - y;
      if (dx * dx + dy * dy > radiusSquared) continue;

      const rate = CaptureContributor.rate[ship] as number;
      if ((Owner.playerId[ship] as number) === 1) {
        rateP1 += rate;
        countP1 += 1;
      } else {
        rateP2 += rate;
        countP2 += 1;
      }
    }

    Capturable.presenceP1[planet] = countP1;
    Capturable.presenceP2[planet] = countP2;

    // Player 2 pushes the bar positive, player 1 pushes it negative.
    let net = rateP2 - rateP1;
    if (net > MAX_CAPTURE_RATE) net = MAX_CAPTURE_RATE;
    else if (net < -MAX_CAPTURE_RATE) net = -MAX_CAPTURE_RATE;

    let progress = Capturable.progress[planet] as number;

    if (net === 0) {
      progress = decayToward(progress, deltaTime);
    } else {
      progress += net * deltaTime;
    }

    if (progress > CAPTURE_THRESHOLD) progress = CAPTURE_THRESHOLD;
    else if (progress < -CAPTURE_THRESHOLD) progress = -CAPTURE_THRESHOLD;

    Capturable.progress[planet] = progress;

    resolveOwnership(world, planet, progress);
  }
}

/** Uncontested planets drift back toward neutral when decay is enabled. */
function decayToward(progress: number, deltaTime: number): number {
  if (CAPTURE_DECAY_RATE <= 0) return progress;
  const step = CAPTURE_DECAY_RATE * deltaTime;
  if (progress > 0) return Math.max(0, progress - step);
  if (progress < 0) return Math.min(0, progress + step);
  return 0;
}

/** Transfers the planet, its moons and its buildings when the bar maxes out. */
function resolveOwnership(world: GameWorld, planet: number, progress: number): void {
  const previousOwner = Owner.playerId[planet] as OwnerId;

  let newOwner: OwnerId = previousOwner;
  if (progress <= -CAPTURE_THRESHOLD) newOwner = 1;
  else if (progress >= CAPTURE_THRESHOLD) newOwner = 2;

  if (newOwner === previousOwner) return;

  Owner.playerId[planet] = newOwner;
  transferChildren(world, planet, newOwner);

  const player = world.context.players.get(newOwner as PlayerId);
  if (player !== undefined) {
    player.stats.planetsCaptured += 1;
  }

  emitEvent(world, {
    type: 'PLANET_CAPTURED',
    planetIndex: PlanetRef.index[planet] as number,
    previousOwner,
    newOwner,
  });
}

/**
 * Reassigns moons and buildings to the planet's new owner.
 *
 * The docs specify that capturing a planet captures its moons and transfers all
 * buildings, and that the previous owner loses reinforcements from them.
 */
function transferChildren(world: GameWorld, planet: number, newOwner: OwnerId): void {
  const planetIndex = PlanetRef.index[planet] as number;

  const moons = orbitalQuery(world);
  for (let i = 0; i < moons.length; i += 1) {
    const moon = moons[i] as number;
    if (Parent.entity[moon] !== planet) continue;
    Owner.playerId[moon] = newOwner;
  }

  const buildings = buildingQuery(world);
  for (let i = 0; i < buildings.length; i += 1) {
    const building = buildings[i] as number;
    if ((PlanetRef.index[building] as number) !== planetIndex) continue;

    Owner.playerId[building] = newOwner;

    // A neutral planet's factories cannot produce for anyone.
    if (hasComponent(world, Production, building)) {
      Production.active[building] = newOwner === 0 ? 0 : 1;
    }
  }
}

/** Recomputes each player's controlled-planet list from planet ownership. */
export function updatePlanetControl(world: GameWorld): void {
  const { players, planetEntities } = world.context;

  for (const player of players.values()) {
    player.controlledPlanets.length = 0;
  }

  for (let i = 0; i < planetEntities.length; i += 1) {
    const planet = planetEntities[i] as number;
    const owner = Owner.playerId[planet] as OwnerId;
    if (owner === 0) continue;

    const player = players.get(owner);
    if (player === undefined) continue;
    player.controlledPlanets.push(PlanetRef.index[planet] as number);
  }
}
