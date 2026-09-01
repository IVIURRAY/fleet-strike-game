/**
 * WebSocket client.
 *
 * Owns the socket lifecycle and turns inbound frames into typed callbacks. All
 * game state handling lives in the store; this layer only concerns itself with
 * transport.
 */

import type { ClientMessage, ServerMessage } from '@fleet-strike/types';

/** Connection lifecycle states surfaced to the UI. */
export const CONNECTION_STATES = ['idle', 'connecting', 'open', 'closed', 'error'] as const;
export type ConnectionState = (typeof CONNECTION_STATES)[number];

/** Callbacks the client invokes. */
export interface NetworkHandlers {
  onMessage(message: ServerMessage): void;
  onStateChange(state: ConnectionState): void;
}

/** Resolves the WebSocket URL, honouring an env override for deployments. */
export function resolveServerUrl(): string {
  const configured = import.meta.env['VITE_API_URL'] as string | undefined;
  if (configured !== undefined && configured.length > 0) {
    return configured.endsWith('/ws') ? configured : `${configured.replace(/\/$/, '')}/ws`;
  }

  // In dev the client is on 5173 and the server on 3000; in production both sit
  // behind the same origin.
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const isDevPort = window.location.port === '5173';
  const host = isDevPort ? `${window.location.hostname}:3000` : window.location.host;
  return `${protocol}//${host}/ws`;
}

export class NetworkClient {
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private readonly handlers: NetworkHandlers;
  private readonly url: string;
  /** Commands issued before the socket opened, flushed on connect. */
  private readonly pending: ClientMessage[] = [];

  constructor(handlers: NetworkHandlers, url: string = resolveServerUrl()) {
    this.handlers = handlers;
    this.url = url;
  }

  get connectionState(): ConnectionState {
    return this.state;
  }

  get isOpen(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /** Opens the connection. Safe to call when already connected. */
  connect(): void {
    if (this.socket !== null && this.socket.readyState <= WebSocket.OPEN) return;

    this.setState('connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.setState('open');
      while (this.pending.length > 0) {
        const message = this.pending.shift();
        if (message !== undefined) this.send(message);
      }
    });

    socket.addEventListener('message', (event: MessageEvent<string>) => {
      let parsed: ServerMessage;
      try {
        parsed = JSON.parse(event.data) as ServerMessage;
      } catch {
        // A malformed frame from the server is not recoverable here; drop it.
        return;
      }
      this.handlers.onMessage(parsed);
    });

    socket.addEventListener('close', () => {
      this.setState('closed');
      this.socket = null;
    });

    socket.addEventListener('error', () => {
      this.setState('error');
    });
  }

  /** Sends a command, queueing it if the socket is not open yet. */
  send(message: ClientMessage): void {
    if (!this.isOpen) {
      this.pending.push(message);
      this.connect();
      return;
    }
    this.socket?.send(JSON.stringify(message));
  }

  /** Closes the connection. */
  disconnect(): void {
    this.pending.length = 0;
    this.socket?.close();
    this.socket = null;
    this.setState('closed');
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.handlers.onStateChange(state);
  }
}
