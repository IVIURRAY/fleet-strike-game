/**
 * Explosion particle pool.
 *
 * Particle state is held in flat arrays and pooled, so a large battle produces
 * no per-frame allocation. A single Graphics object is redrawn each frame rather
 * than one display object per particle, which keeps the PixiJS scene graph small.
 */

import { Graphics } from 'pixi.js';
import { easeOutQuad } from '@fleet-strike/utils';

/** Maximum simultaneous particles before the oldest are overwritten. */
export const MAX_PARTICLES = 1500;

export class ParticleSystem {
  readonly graphics = new Graphics();

  private readonly x = new Float32Array(MAX_PARTICLES);
  private readonly y = new Float32Array(MAX_PARTICLES);
  private readonly dx = new Float32Array(MAX_PARTICLES);
  private readonly dy = new Float32Array(MAX_PARTICLES);
  private readonly life = new Float32Array(MAX_PARTICLES);
  private readonly maxLife = new Float32Array(MAX_PARTICLES);
  private readonly size = new Float32Array(MAX_PARTICLES);
  private readonly color = new Uint32Array(MAX_PARTICLES);

  /** Ring buffer cursor. */
  private next = 0;
  private liveCount = 0;

  get count(): number {
    return this.liveCount;
  }

  /** Spawns a radial burst of particles. */
  spawnExplosion(x: number, y: number, scale: number, color: number, random: () => number): void {
    const particles = Math.min(40, Math.max(6, Math.round(scale * 8)));
    for (let i = 0; i < particles; i += 1) {
      const angle = random() * Math.PI * 2;
      const speed = (60 + random() * 220) * Math.max(0.5, scale * 0.6);
      this.spawn(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.35 + random() * 0.55,
        (2 + random() * 4) * Math.max(0.6, scale * 0.5),
        color
      );
    }
  }

  /** Spawns a single engine trail puff behind a ship. */
  spawnTrail(x: number, y: number, angle: number, color: number, random: () => number): void {
    const backward = angle + Math.PI;
    const drift = (random() - 0.5) * 40;
    this.spawn(
      x,
      y,
      Math.cos(backward) * 40 + drift,
      Math.sin(backward) * 40 + drift,
      0.18 + random() * 0.18,
      1.5 + random() * 1.8,
      color
    );
  }

  /** Adds one particle, reusing the oldest slot when full. */
  spawn(
    x: number,
    y: number,
    dx: number,
    dy: number,
    life: number,
    size: number,
    color: number
  ): void {
    const i = this.next;
    this.next = (this.next + 1) % MAX_PARTICLES;

    if (this.life[i] === 0) this.liveCount += 1;

    this.x[i] = x;
    this.y[i] = y;
    this.dx[i] = dx;
    this.dy[i] = dy;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.size[i] = size;
    this.color[i] = color;
  }

  /** Advances every particle and redraws the batch. */
  update(deltaTime: number): void {
    const graphics = this.graphics;
    graphics.clear();

    let live = 0;

    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const remaining = this.life[i] as number;
      if (remaining <= 0) continue;

      const next = remaining - deltaTime;
      if (next <= 0) {
        this.life[i] = 0;
        continue;
      }

      this.life[i] = next;
      live += 1;

      // Drag so bursts decelerate rather than flying off linearly.
      const drag = 1 - 2.2 * deltaTime;
      const vx = (this.dx[i] as number) * (drag > 0 ? drag : 0);
      const vy = (this.dy[i] as number) * (drag > 0 ? drag : 0);
      this.dx[i] = vx;
      this.dy[i] = vy;

      const px = (this.x[i] as number) + vx * deltaTime;
      const py = (this.y[i] as number) + vy * deltaTime;
      this.x[i] = px;
      this.y[i] = py;

      const t = next / (this.maxLife[i] as number);
      const alpha = easeOutQuad(t);
      const radius = (this.size[i] as number) * (0.4 + t * 0.6);

      graphics.circle(px, py, radius);
      graphics.fill({ color: this.color[i] as number, alpha: alpha * 0.9 });
    }

    this.liveCount = live;
  }

  /** Removes every particle. */
  clear(): void {
    this.life.fill(0);
    this.liveCount = 0;
    this.next = 0;
    this.graphics.clear();
  }
}
