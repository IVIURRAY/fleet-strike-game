import { describe, expect, it } from 'vitest';

import { EXOTIC_CAP } from '@fleet-strike/config';

import {
  grant,
  hasResources,
  makeCaps,
  missingResource,
  refundManpower,
  spend,
} from './resources';
import { clampToWorldInto, isFiniteNumber, isNonNegativeInteger, isWithinWorld } from './bounds';

function pool(overrides: Partial<ReturnType<typeof basePool>> = {}) {
  return { ...basePool(), ...overrides };
}

function basePool() {
  return { gold: 100, manpower: 10, crystal: 0, gas: 0, tungsten: 0 };
}

const price = (overrides: Partial<Record<string, number>> = {}) => ({
  gold: 0,
  manpower: 0,
  crystal: 0,
  gas: 0,
  tungsten: 0,
  ...overrides,
});

describe('missingResource', () => {
  it('returns null when affordable', () => {
    expect(missingResource(pool(), price({ gold: 50, manpower: 5 }))).toBeNull();
  });

  it('names the deficient resource', () => {
    expect(missingResource(pool(), price({ gold: 500 }))).toBe('gold');
    expect(missingResource(pool(), price({ manpower: 50 }))).toBe('manpower');
    expect(missingResource(pool(), price({ crystal: 1 }))).toBe('crystal');
    expect(missingResource(pool(), price({ gas: 1 }))).toBe('gas');
    expect(missingResource(pool(), price({ tungsten: 1 }))).toBe('tungsten');
  });

  it('treats an exact balance as affordable', () => {
    expect(hasResources(pool(), price({ gold: 100, manpower: 10 }))).toBe(true);
  });
});

describe('spend', () => {
  it('deducts an affordable cost', () => {
    const p = pool();
    expect(spend(p, price({ gold: 40, manpower: 3 }))).toBe(true);
    expect(p.gold).toBe(60);
    expect(p.manpower).toBe(7);
  });

  it('leaves the pool untouched when unaffordable', () => {
    const p = pool();
    expect(spend(p, price({ gold: 5000 }))).toBe(false);
    expect(p).toEqual(basePool());
  });

  it('never drives a balance negative', () => {
    const p = pool({ gold: 10 });
    spend(p, price({ gold: 20 }));
    expect(p.gold).toBeGreaterThanOrEqual(0);
  });
});

describe('grant', () => {
  const caps = makeCaps(200);

  it('leaves gold uncapped', () => {
    const p = pool({ gold: 0 });
    grant(p, 'gold', 100000, caps);
    expect(p.gold).toBe(100000);
  });

  it('caps manpower', () => {
    const p = pool({ manpower: 190 });
    grant(p, 'manpower', 100, caps);
    expect(p.manpower).toBe(200);
  });

  it('caps exotics at the documented ceiling', () => {
    const p = pool();
    grant(p, 'crystal', 10000, caps);
    expect(p.crystal).toBe(EXOTIC_CAP);
  });

  it('ignores non-positive amounts', () => {
    const p = pool({ gold: 50 });
    grant(p, 'gold', 0, caps);
    grant(p, 'gold', -10, caps);
    expect(p.gold).toBe(50);
  });
});

describe('refundManpower', () => {
  it('returns manpower without exceeding the cap', () => {
    const caps = makeCaps(200);
    const p = pool({ manpower: 199 });
    refundManpower(p, 5, caps);
    expect(p.manpower).toBe(200);
  });
});

describe('makeCaps', () => {
  it('applies the manpower ceiling and fixed exotic caps', () => {
    const caps = makeCaps(350);
    expect(caps.manpower).toBe(350);
    expect(caps.crystal).toBe(EXOTIC_CAP);
    expect(caps.gas).toBe(EXOTIC_CAP);
    expect(caps.tungsten).toBe(EXOTIC_CAP);
  });
});

describe('bounds', () => {
  it('accepts positions inside the world', () => {
    expect(isWithinWorld(100, 100)).toBe(true);
    expect(isWithinWorld(-1, 100)).toBe(false);
  });

  it('clamps out-of-bounds positions', () => {
    const target = { x: 0, y: 0 };
    clampToWorldInto(-500, -500, target);
    expect(target).toEqual({ x: 0, y: 0 });

    clampToWorldInto(1e9, 1e9, target);
    expect(target.x).toBeGreaterThan(0);
    expect(target.y).toBeGreaterThan(0);
    expect(isWithinWorld(target.x, target.y)).toBe(true);
  });

  it('rejects NaN and Infinity', () => {
    expect(isFiniteNumber(5)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isFiniteNumber('5')).toBe(false);
  });

  it('validates non-negative integers', () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(3)).toBe(true);
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isNonNegativeInteger(1.5)).toBe(false);
  });
});
