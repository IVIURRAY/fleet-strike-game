/**
 * Repair system — Medic beams and moon Repair Stations.
 *
 * Medics service up to `Repairer.targets` allies at once, prioritising the most
 * damaged so healing is not wasted on ships at full health.
 */

import { Health, Owner, Position, Repairer, SupportAura } from '../components';
import { auraQuery, repairerQuery } from '../queries';
import type { GameWorld } from '../world';
import { applyHealing } from './damage';

/** Applies healing from every repair source. */
export function repairSystem(world: GameWorld, deltaTime: number): void {
  repairFromShips(world, deltaTime);
  repairFromAuras(world, deltaTime);
}

/** Scratch buffer for candidate targets, reused across entities. */
const candidates: number[] = [];

function repairFromShips(world: GameWorld, deltaTime: number): void {
  const medics = repairerQuery(world);
  const { shipGrid } = world.context;

  for (let i = 0; i < medics.length; i += 1) {
    const eid = medics[i] as number;
    const x = Position.x[eid] as number;
    const y = Position.y[eid] as number;
    const range = Repairer.range[eid] as number;
    const owner = Owner.playerId[eid] as number;
    const maxTargets = Repairer.targets[eid] as number;
    const perSecond = Repairer.perSecond[eid] as number;

    collectDamagedAllies(shipGrid.query(x, y, range), owner, x, y, range, eid);
    if (candidates.length === 0) continue;

    // Most damaged first, so a wounded Heavy is prioritised over a scratched Scout.
    candidates.sort(byMissingHpDescending);

    const count = Math.min(maxTargets, candidates.length);
    for (let j = 0; j < count; j += 1) {
      applyHealing(world, candidates[j] as number, perSecond * deltaTime);
    }
  }
}

function repairFromAuras(world: GameWorld, deltaTime: number): void {
  const structures = auraQuery(world);
  const { shipGrid } = world.context;

  for (let i = 0; i < structures.length; i += 1) {
    const eid = structures[i] as number;
    const perSecond = SupportAura.repairPerSecond[eid] as number;
    if (perSecond <= 0) continue;

    const x = Position.x[eid] as number;
    const y = Position.y[eid] as number;
    const radius = SupportAura.radius[eid] as number;
    const owner = Owner.playerId[eid] as number;

    // Repair Stations heal every ally in range, not a limited number.
    const nearby = shipGrid.query(x, y, radius);
    const radiusSquared = radius * radius;
    for (let j = 0; j < nearby.length; j += 1) {
      const ally = nearby[j] as number;
      if ((Owner.playerId[ally] as number) !== owner) continue;

      const dx = (Position.x[ally] as number) - x;
      const dy = (Position.y[ally] as number) - y;
      if (dx * dx + dy * dy > radiusSquared) continue;

      applyHealing(world, ally, perSecond * deltaTime);
    }
  }
}

function collectDamagedAllies(
  nearby: readonly number[],
  owner: number,
  x: number,
  y: number,
  range: number,
  self: number
): void {
  candidates.length = 0;
  const rangeSquared = range * range;

  for (let i = 0; i < nearby.length; i += 1) {
    const ally = nearby[i] as number;
    if (ally === self) continue;
    if ((Owner.playerId[ally] as number) !== owner) continue;

    const current = Health.current[ally] as number;
    if (current <= 0 || current >= (Health.max[ally] as number)) continue;

    const dx = (Position.x[ally] as number) - x;
    const dy = (Position.y[ally] as number) - y;
    if (dx * dx + dy * dy > rangeSquared) continue;

    candidates.push(ally);
  }
}

function byMissingHpDescending(a: number, b: number): number {
  const missingA = (Health.max[a] as number) - (Health.current[a] as number);
  const missingB = (Health.max[b] as number) - (Health.current[b] as number);
  return missingB - missingA;
}
