/**
 * Identifier generation.
 */

import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@fleet-strike/config';

let counter = 0;

/**
 * Generates a process-unique identifier.
 *
 * Combines a monotonic counter with a random suffix so ids stay unique across
 * restarts without needing a dependency on `crypto.randomUUID`.
 */
export function generateId(prefix = 'id'): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${counter.toString(36)}_${random}`;
}

/** Resets the internal counter. Test-only. */
export function resetIdCounter(): void {
  counter = 0;
}

/**
 * Generates a shareable room code from an unambiguous alphabet.
 *
 * `random` is injectable so tests can make code generation deterministic.
 */
export function generateRoomCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
    const index = Math.floor(random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET.charAt(index);
  }
  return code;
}

/** True when `code` could be a valid room code. */
export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  for (const char of code) {
    if (!ROOM_CODE_ALPHABET.includes(char)) return false;
  }
  return true;
}

/** Uppercases and trims user input before room code validation. */
export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase();
}
