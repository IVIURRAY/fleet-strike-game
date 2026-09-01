import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Lobby } from '../matchmaking/lobby';
import { createHttpApp } from './http';

let server: Server;
let baseUrl: string;
let lobby: Lobby;

beforeAll(async () => {
  lobby = new Lobby();
  server = createServer(createHttpApp(lobby));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  lobby.destroyAll();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error !== undefined && error !== null ? reject(error) : resolve()));
  });
});

describe('GET /health', () => {
  it('reports ok, as the load balancer healthcheck expects', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string; uptime: number };
    expect(body.status).toBe('ok');
    expect(body.uptime).toBeGreaterThan(0);
  });
});

describe('GET /api/status', () => {
  it('reports zero rooms when idle', async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const body = (await response.json()) as { rooms: number; details: unknown[] };
    expect(response.status).toBe(200);
    expect(body.rooms).toBe(0);
    expect(body.details).toEqual([]);
  });

  it('counts open rooms', async () => {
    const room = lobby.createRoom();

    const response = await fetch(`${baseUrl}/api/status`);
    const body = (await response.json()) as {
      rooms: number;
      details: Array<{ code: string; playerCount: number }>;
    };

    expect(body.rooms).toBe(1);
    expect(body.details[0]?.code).toBe(room.code);
    expect(body.details[0]?.playerCount).toBe(0);

    lobby.removeRoom(room.code);
  });
});

describe('GET /api/rooms/:code', () => {
  it('describes an existing room', async () => {
    const room = lobby.createRoom();

    const response = await fetch(`${baseUrl}/api/rooms/${room.code}`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { code: string; phase: string; isFull: boolean };
    expect(body.code).toBe(room.code);
    expect(body.phase).toBe('lobby');
    expect(body.isFull).toBe(false);

    lobby.removeRoom(room.code);
  });

  it('accepts a lowercase code', async () => {
    const room = lobby.createRoom();
    const response = await fetch(`${baseUrl}/api/rooms/${room.code.toLowerCase()}`);
    expect(response.status).toBe(200);
    lobby.removeRoom(room.code);
  });

  it('returns 404 for an unknown code', async () => {
    const response = await fetch(`${baseUrl}/api/rooms/ZZZZZZ`);
    expect(response.status).toBe(404);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/no room/i);
  });

  it('returns 404 for a malformed code rather than erroring', async () => {
    const response = await fetch(`${baseUrl}/api/rooms/nope`);
    expect(response.status).toBe(404);
  });
});

describe('unknown routes', () => {
  it('returns a json 404', async () => {
    const response = await fetch(`${baseUrl}/definitely-not-a-route`);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toMatch(/json/);
  });
});

describe('CORS', () => {
  it('allows cross-origin requests so the dev client on 5173 can reach the api', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});
