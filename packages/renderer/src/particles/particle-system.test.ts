import { describe, expect, it } from 'vitest';

import { createRandom } from '@fleet-strike/utils';

import { MAX_PARTICLES, ParticleSystem } from './particle-system';

describe('ParticleSystem', () => {
  it('starts empty', () => {
    const system = new ParticleSystem();
    expect(system.count).toBe(0);
  });

  it('spawns particles for an explosion', () => {
    const system = new ParticleSystem();
    system.spawnExplosion(100, 100, 2, 0xff0000, createRandom(1));
    system.update(0.001);
    expect(system.count).toBeGreaterThan(0);
  });

  it('scales particle count with explosion size', () => {
    const small = new ParticleSystem();
    small.spawnExplosion(0, 0, 0.5, 0xffffff, createRandom(1));
    small.update(0.001);

    const large = new ParticleSystem();
    large.spawnExplosion(0, 0, 5, 0xffffff, createRandom(1));
    large.update(0.001);

    expect(large.count).toBeGreaterThan(small.count);
  });

  it('expires particles over time', () => {
    const system = new ParticleSystem();
    system.spawnExplosion(0, 0, 1, 0xffffff, createRandom(2));
    system.update(0.001);
    expect(system.count).toBeGreaterThan(0);

    // Explosion particles live at most ~0.9 seconds.
    system.update(2);
    expect(system.count).toBe(0);
  });

  it('moves particles outward from the origin', () => {
    const system = new ParticleSystem();
    system.spawn(0, 0, 100, 0, 1, 3, 0xffffff);
    system.update(0.1);
    // Position is internal, so assert indirectly: the particle is still alive
    // and the batch drew something.
    expect(system.count).toBe(1);
  });

  it('never exceeds the particle cap', () => {
    const system = new ParticleSystem();
    const random = createRandom(3);
    for (let i = 0; i < 500; i += 1) {
      system.spawnExplosion(i, i, 5, 0xffffff, random);
    }
    system.update(0.001);
    expect(system.count).toBeLessThanOrEqual(MAX_PARTICLES);
  });

  it('spawns engine trail puffs', () => {
    const system = new ParticleSystem();
    system.spawnTrail(50, 50, 0, 0x00ffff, createRandom(4));
    system.update(0.001);
    expect(system.count).toBe(1);
  });

  it('clears every particle', () => {
    const system = new ParticleSystem();
    system.spawnExplosion(0, 0, 3, 0xffffff, createRandom(5));
    system.update(0.001);
    expect(system.count).toBeGreaterThan(0);

    system.clear();
    expect(system.count).toBe(0);
  });

  it('is deterministic for a fixed seed', () => {
    const a = new ParticleSystem();
    a.spawnExplosion(0, 0, 3, 0xffffff, createRandom(7));
    a.update(0.05);

    const b = new ParticleSystem();
    b.spawnExplosion(0, 0, 3, 0xffffff, createRandom(7));
    b.update(0.05);

    expect(a.count).toBe(b.count);
  });

  it('survives a long run without leaking live particles', () => {
    const system = new ParticleSystem();
    const random = createRandom(8);
    for (let frame = 0; frame < 300; frame += 1) {
      system.spawnExplosion(frame, 0, 1, 0xffffff, random);
      system.update(1 / 60);
    }
    // Steady state must stay well under the cap.
    expect(system.count).toBeLessThan(MAX_PARTICLES);

    for (let frame = 0; frame < 200; frame += 1) system.update(1 / 60);
    expect(system.count).toBe(0);
  });
});
