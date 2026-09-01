/**
 * Transient visual effects driven by server game events.
 *
 * Explosions and muzzle flashes cannot be derived from a state snapshot, so the
 * server emits events and this layer turns them into particles and short-lived
 * beam graphics.
 */

import { Graphics } from 'pixi.js';
import type { GameEvent } from '@fleet-strike/types';
import { COLORS, TEAM_COLORS, WEAPONS } from '@fleet-strike/config';
import { ParticleSystem, drawBeam } from '@fleet-strike/renderer';
import type { RandomSource } from '@fleet-strike/utils';
import { createRandom } from '@fleet-strike/utils';

import type { SceneLayers } from '../canvas/create-canvas';

/** A hitscan beam being drawn out over a few frames. */
interface Beam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: number;
  /** Remaining lifetime in seconds. */
  life: number;
}

/** Seconds a laser beam stays visible after firing. */
const BEAM_LIFETIME = 0.12;

export class EffectsRenderer {
  private readonly particles = new ParticleSystem();
  private readonly beamGraphics = new Graphics();
  private readonly beams: Beam[] = [];
  private readonly random: RandomSource;

  constructor(layers: SceneLayers, seed = 1) {
    layers.effects.addChild(this.particles.graphics, this.beamGraphics);
    this.random = createRandom(seed);
  }

  /** Queues effects for a batch of server events. */
  handleEvents(events: readonly GameEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case 'ENTITY_DESTROYED':
          this.particles.spawnExplosion(
            event.x,
            event.y,
            event.scale,
            event.scale > 2 ? COLORS.goldBright : COLORS.gold,
            this.random
          );
          break;

        case 'WEAPON_FIRED':
          if (event.isHitscan) {
            const weapon = WEAPONS[event.weaponType as keyof typeof WEAPONS];
            this.beams.push({
              fromX: event.x,
              fromY: event.y,
              toX: event.targetX,
              toY: event.targetY,
              color: weapon?.color ?? COLORS.cyanBright,
              life: BEAM_LIFETIME,
            });
          } else {
            // A small muzzle flash sells the shot even before the projectile moves.
            this.particles.spawn(
              event.x,
              event.y,
              Math.cos(event.rotation) * 60,
              Math.sin(event.rotation) * 60,
              0.08,
              2.5,
              COLORS.gold
            );
          }
          break;

        case 'SHIP_SPAWNED':
          this.particles.spawnExplosion(
            event.x,
            event.y,
            0.8,
            TEAM_COLORS[event.owner],
            this.random
          );
          break;

        case 'PLANET_CAPTURED':
          // Handled by the HUD as a toast; no world-space effect needed.
          break;

        default:
          break;
      }
    }
  }

  /** Advances particles and beams. */
  update(deltaTime: number): void {
    this.particles.update(deltaTime);

    this.beamGraphics.clear();
    for (let i = this.beams.length - 1; i >= 0; i -= 1) {
      const beam = this.beams[i];
      if (beam === undefined) continue;

      beam.life -= deltaTime;
      if (beam.life <= 0) {
        // Swap-remove; beam order does not matter.
        this.beams[i] = this.beams[this.beams.length - 1] as Beam;
        this.beams.pop();
        continue;
      }

      drawBeam(
        this.beamGraphics,
        beam.fromX,
        beam.fromY,
        beam.toX,
        beam.toY,
        beam.color,
        beam.life / BEAM_LIFETIME
      );
    }
  }

  /** Live particle count, for the performance overlay. */
  get particleCount(): number {
    return this.particles.count;
  }

  /** Removes every effect. */
  clear(): void {
    this.particles.clear();
    this.beams.length = 0;
    this.beamGraphics.clear();
  }
}
