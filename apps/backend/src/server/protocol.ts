/**
 * Client message parsing and validation.
 *
 * Everything arriving over the socket is untrusted, so messages are parsed
 * defensively: size-limited, JSON-checked, and narrowed to the protocol union
 * before any handler sees them.
 */

import type { BuildingType, ClientMessage } from '@fleet-strike/types';
import { MAX_MESSAGE_BYTES, MAX_PLAYER_NAME_LENGTH } from '@fleet-strike/config';

/** Result of parsing an inbound frame. */
export type ParseResult =
  | { ok: true; message: ClientMessage }
  | { ok: false; reason: string };

/** Parses and validates a raw WebSocket frame. */
export function parseClientMessage(raw: string): ParseResult {
  if (raw.length > MAX_MESSAGE_BYTES) {
    return { ok: false, reason: 'Message too large' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'Malformed JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, reason: 'Message must be an object' };
  }

  const record = parsed as Record<string, unknown>;
  const type = record['type'];
  if (typeof type !== 'string') {
    return { ok: false, reason: 'Message type must be a string' };
  }

  switch (type) {
    case 'CREATE_ROOM':
      return { ok: true, message: { type, playerName: sanitizeName(record['playerName']) } };

    case 'JOIN_ROOM': {
      const code = record['code'];
      if (typeof code !== 'string') {
        return { ok: false, reason: 'Room code must be a string' };
      }
      return {
        ok: true,
        message: { type, code, playerName: sanitizeName(record['playerName']) },
      };
    }

    case 'LEAVE_ROOM':
      return { ok: true, message: { type } };

    case 'SET_WAYPOINT': {
      const x = record['x'];
      const y = record['y'];
      if (!isFinitePlainNumber(x) || !isFinitePlainNumber(y)) {
        return { ok: false, reason: 'Waypoint coordinates must be finite numbers' };
      }
      return { ok: true, message: { type, x, y } };
    }

    case 'BUILD_STRUCTURE': {
      const planetIndex = record['planetIndex'];
      const buildingType = record['buildingType'];
      const moonId = record['moonId'];

      if (typeof planetIndex !== 'number' || !Number.isInteger(planetIndex)) {
        return { ok: false, reason: 'planetIndex must be an integer' };
      }
      if (typeof buildingType !== 'string') {
        return { ok: false, reason: 'buildingType must be a string' };
      }
      if (moonId !== null && moonId !== undefined && typeof moonId !== 'string') {
        return { ok: false, reason: 'moonId must be a string or null' };
      }

      return {
        ok: true,
        message: {
          type,
          planetIndex,
          moonId: typeof moonId === 'string' ? moonId : null,
          // Checked against the real building registry by validateBuild; this
          // stage only guarantees the shape.
          buildingType: buildingType as BuildingType,
        },
      };
    }

    case 'UPGRADE_BUILDING': {
      const buildingId = record['buildingId'];
      if (typeof buildingId !== 'number' || !Number.isInteger(buildingId) || buildingId < 0) {
        return { ok: false, reason: 'buildingId must be a non-negative integer' };
      }
      return { ok: true, message: { type, buildingId } };
    }

    case 'PING': {
      const sentAt = record['sentAt'];
      return {
        ok: true,
        message: { type, sentAt: isFinitePlainNumber(sentAt) ? sentAt : 0 },
      };
    }

    default:
      return { ok: false, reason: `Unknown message type: ${type}` };
  }
}

/** Trims a player-supplied name to a safe length, with a fallback. */
export function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return 'Captain';
  // Strip control characters that would corrupt the HUD.
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (cleaned.length === 0) return 'Captain';
  return cleaned.slice(0, MAX_PLAYER_NAME_LENGTH);
}

function isFinitePlainNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
