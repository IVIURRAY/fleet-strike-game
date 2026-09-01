/**
 * Express HTTP server.
 *
 * The game itself runs entirely over WebSockets; HTTP exists for health checks
 * (required by the load balancer in docs/Technical_Architecture.md) and for a
 * small status endpoint.
 */

import express from 'express';
import cors from 'cors';
import type { Express } from 'express';

import type { Lobby } from '../matchmaking/lobby';

/** Builds the Express application. */
export function createHttpApp(lobby: Lobby): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '16kb' }));

  // Referenced by the Terraform load balancer health check.
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/api/status', (_request, response) => {
    response.json({
      rooms: lobby.roomCount,
      details: lobby.listRooms(),
    });
  });

  // Lets the client confirm a code exists before opening a socket.
  app.get('/api/rooms/:code', (request, response) => {
    const room = lobby.findRoom(request.params.code);
    if (room === undefined) {
      response.status(404).json({ error: 'No room with that code' });
      return;
    }
    response.json({
      code: room.code,
      phase: room.phase,
      playerCount: room.playerCount,
      isFull: room.isFull,
    });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });

  return app;
}
