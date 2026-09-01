import { describe, expect, it } from 'vitest';

import { ROOM_CODE_LENGTH } from '@fleet-strike/config';

import {
  generateId,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  resetIdCounter,
} from './id-generation';
import { createRandom, randomAngle, randomElement, randomInt, randomRange } from './random';

describe('generateId', () => {
  it('produces unique ids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it('applies the prefix', () => {
    expect(generateId('room')).toMatch(/^room_/);
  });

  it('can be reset for deterministic tests', () => {
    resetIdCounter();
    const first = generateId('x');
    resetIdCounter();
    const second = generateId('x');
    expect(first.split('_')[1]).toBe(second.split('_')[1]);
  });
});

describe('generateRoomCode', () => {
  it('produces a code of the configured length', () => {
    expect(generateRoomCode()).toHaveLength(ROOM_CODE_LENGTH);
  });

  it('produces only valid codes', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(isValidRoomCode(generateRoomCode())).toBe(true);
    }
  });

  it('is deterministic with a seeded source', () => {
    const a = generateRoomCode(createRandom(42));
    const b = generateRoomCode(createRandom(42));
    expect(a).toBe(b);
  });

  it('excludes ambiguous characters', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[IO01]/);
    }
  });
});

describe('isValidRoomCode', () => {
  it('rejects wrong lengths and characters', () => {
    expect(isValidRoomCode('ABC')).toBe(false);
    expect(isValidRoomCode('ABCDEFG')).toBe(false);
    expect(isValidRoomCode('ABCDE1')).toBe(false);
    expect(isValidRoomCode('abcdef')).toBe(false);
  });

  it('accepts a well-formed code', () => {
    expect(isValidRoomCode('ABCDEF')).toBe(true);
  });
});

describe('normalizeRoomCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeRoomCode('  abcdef  ')).toBe('ABCDEF');
  });
});

describe('createRandom', () => {
  it('is reproducible for a given seed', () => {
    const a = createRandom(7);
    const b = createRandom(7);
    for (let i = 0; i < 100; i += 1) {
      expect(a()).toBe(b());
    }
  });

  it('differs between seeds', () => {
    expect(createRandom(1)()).not.toBe(createRandom(2)());
  });

  it('stays within [0, 1)', () => {
    const random = createRandom(123);
    for (let i = 0; i < 10000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('random helpers', () => {
  it('bounds randomRange', () => {
    const random = createRandom(9);
    for (let i = 0; i < 1000; i += 1) {
      const value = randomRange(random, 10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThan(20);
    }
  });

  it('bounds randomInt inclusively', () => {
    const random = createRandom(11);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      const value = randomInt(random, 1, 5);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
      seen.add(value);
    }
    expect(seen.size).toBe(5);
  });

  it('bounds randomAngle', () => {
    const random = createRandom(3);
    for (let i = 0; i < 500; i += 1) {
      const angle = randomAngle(random);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
    }
  });

  it('returns undefined for an empty list', () => {
    expect(randomElement(createRandom(1), [])).toBeUndefined();
  });

  it('picks an element from the list', () => {
    const items = ['a', 'b', 'c'];
    const random = createRandom(5);
    for (let i = 0; i < 100; i += 1) {
      expect(items).toContain(randomElement(random, items));
    }
  });
});
