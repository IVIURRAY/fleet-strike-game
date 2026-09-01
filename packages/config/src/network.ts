/**
 * Network and server configuration.
 *
 * Source: docs/Technical_Architecture.md
 */

/** Default backend HTTP/WebSocket port. */
export const SERVER_PORT = 3000;

/** Default Vite dev server port. */
export const CLIENT_PORT = 5173;

/** Maximum client commands accepted per second before throttling. */
export const MAX_COMMANDS_PER_SECOND = 10;

/** Players per room. Fleet Strike is strictly 1v1. */
export const PLAYERS_PER_ROOM = 2;

/** Length of a shareable room code. */
export const ROOM_CODE_LENGTH = 6;

/** Characters used in room codes, excluding easily confused glyphs. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Seconds a disconnected player's slot is held before the match is forfeit. */
export const DISCONNECT_GRACE_PERIOD = 30;

/** Seconds an empty room is retained before being reaped. */
export const EMPTY_ROOM_TTL = 60;

/** Maximum accepted WebSocket frame size in bytes. */
export const MAX_MESSAGE_BYTES = 64 * 1024;

/** Maximum length of a player-supplied display name. */
export const MAX_PLAYER_NAME_LENGTH = 24;
