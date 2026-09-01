/**
 * Backend entry point.
 */

import { createServer } from 'node:http';
import { EMPTY_ROOM_TTL, SERVER_PORT } from '@fleet-strike/config';

import { Lobby } from './matchmaking/lobby';
import { createHttpApp } from './server/http';
import { createWebSocketServer } from './server/websocket';

const port = Number(process.env['PORT'] ?? SERVER_PORT);

const lobby = new Lobby();
const app = createHttpApp(lobby);
const server = createServer(app);

createWebSocketServer(server, lobby);

// Periodically clear out rooms nobody is connected to.
const reaper = setInterval(() => {
  lobby.reapEmptyRooms();
}, EMPTY_ROOM_TTL * 1000);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.warn(`Fleet Strike server listening on http://localhost:${port} (ws: /ws)`);
});

/** Closes the server and every running match. */
function shutdown(signal: string): void {
  // eslint-disable-next-line no-console
  console.warn(`Received ${signal}, shutting down`);
  clearInterval(reaper);
  lobby.destroyAll();
  server.close(() => {
    process.exit(0);
  });
  // Force exit if connections refuse to drain.
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
