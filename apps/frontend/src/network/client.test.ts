import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClientMessage, ServerMessage } from '@fleet-strike/types';

import { NetworkClient } from './client';
import type { ConnectionState } from './client';

/** Minimal scriptable WebSocket stand-in. */
class FakeSocket {
  static instances: FakeSocket[] = [];

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = FakeSocket.CONNECTING;
  readonly sent: string[] = [];
  private readonly listeners = new Map<string, Array<(event: unknown) => void>>();

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event: unknown) => void): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(handler);
    this.listeners.set(type, existing);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeSocket.CLOSED;
    this.emit('close', {});
  }

  /** Simulates the connection opening. */
  open(): void {
    this.readyState = FakeSocket.OPEN;
    this.emit('open', {});
  }

  /** Simulates an inbound frame. */
  receive(message: ServerMessage | string): void {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    this.emit('message', { data });
  }

  /** Simulates a transport error. */
  error(): void {
    this.emit('error', {});
  }

  private emit(type: string, event: unknown): void {
    for (const handler of this.listeners.get(type) ?? []) handler(event);
  }
}

let received: ServerMessage[];
let states: ConnectionState[];

function makeClient(): NetworkClient {
  received = [];
  states = [];
  return new NetworkClient(
    {
      onMessage: (message) => received.push(message),
      onStateChange: (state) => states.push(state),
    },
    'ws://test/ws'
  );
}

function latest(): FakeSocket {
  const socket = FakeSocket.instances[FakeSocket.instances.length - 1];
  if (socket === undefined) throw new Error('no socket was created');
  return socket;
}

function parseSent(socket: FakeSocket): ClientMessage[] {
  return socket.sent.map((raw) => JSON.parse(raw) as ClientMessage);
}

beforeEach(() => {
  FakeSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeSocket);
});

describe('NetworkClient connection', () => {
  it('starts idle', () => {
    const client = makeClient();
    expect(client.connectionState).toBe('idle');
    expect(client.isOpen).toBe(false);
  });

  it('reports connecting then open', () => {
    const client = makeClient();
    client.connect();
    expect(states).toContain('connecting');

    latest().open();
    expect(states).toContain('open');
    expect(client.isOpen).toBe(true);
  });

  it('does not open a second socket while already connected', () => {
    const client = makeClient();
    client.connect();
    latest().open();
    client.connect();
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('reports closure and errors', () => {
    const client = makeClient();
    client.connect();
    const socket = latest();
    socket.open();

    socket.error();
    expect(states).toContain('error');

    socket.close();
    expect(states).toContain('closed');
    expect(client.isOpen).toBe(false);
  });

  it('uses the supplied url', () => {
    const client = makeClient();
    client.connect();
    expect(latest().url).toBe('ws://test/ws');
  });
});

describe('NetworkClient sending', () => {
  it('sends immediately when open', () => {
    const client = makeClient();
    client.connect();
    const socket = latest();
    socket.open();

    client.send({ type: 'PING', sentAt: 5 });
    expect(parseSent(socket)).toEqual([{ type: 'PING', sentAt: 5 }]);
  });

  it('queues commands issued before the socket opens, then flushes in order', () => {
    const client = makeClient();

    // No explicit connect: sending must establish the connection itself.
    client.send({ type: 'CREATE_ROOM', playerName: 'Ada' });
    client.send({ type: 'PING', sentAt: 1 });

    const socket = latest();
    expect(socket.sent).toHaveLength(0);

    socket.open();

    const sent = parseSent(socket);
    expect(sent).toHaveLength(2);
    expect(sent[0]?.type).toBe('CREATE_ROOM');
    expect(sent[1]?.type).toBe('PING');
  });

  it('drops the queue on disconnect', () => {
    const client = makeClient();
    client.send({ type: 'PING', sentAt: 1 });
    const socket = latest();

    client.disconnect();
    socket.open();

    expect(socket.sent).toHaveLength(0);
    expect(states).toContain('closed');
  });
});

describe('NetworkClient receiving', () => {
  it('parses and forwards server messages', () => {
    const client = makeClient();
    client.connect();
    const socket = latest();
    socket.open();

    socket.receive({ type: 'ROOM_CREATED', code: 'ABCDEF', playerId: 1 });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ type: 'ROOM_CREATED', code: 'ABCDEF', playerId: 1 });
  });

  it('ignores malformed frames rather than throwing', () => {
    const client = makeClient();
    client.connect();
    const socket = latest();
    socket.open();

    expect(() => socket.receive('{not json')).not.toThrow();
    expect(received).toHaveLength(0);
  });

  it('handles a burst of messages', () => {
    const client = makeClient();
    client.connect();
    const socket = latest();
    socket.open();

    for (let i = 0; i < 50; i += 1) {
      socket.receive({ type: 'PONG', sentAt: i });
    }
    expect(received).toHaveLength(50);
  });
});
