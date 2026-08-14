/**
 * Wire protocol shared with the SoluStock Relay. Keep in sync with:
 *   - solustock-relay/src/protocol.ts
 *   - stock-mobileapp/src/services/relay/protocol.ts
 */

export const RELAY_EVENTS = {
  REGISTER: 'relay:register',
  HOSTS_LIST: 'relay:hosts:list',
  HOSTS_UPDATE: 'relay:hosts:update',
  SEND: 'relay:send',
  RECEIVE: 'relay:receive',
  PEER_STATUS: 'relay:peer:status',
} as const;

/** Key used for the relay token in the socket.io handshake `auth` object. */
export const RELAY_TOKEN_KEY = 'token';

export interface RelayHostInfo {
  clientId: string;
  name?: string;
  meta?: Record<string, unknown>;
  locked: boolean;
  clients: string[];
}

export interface RequestEnvelope {
  kind: 'request';
  requestId: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ResponseEnvelope {
  kind: 'response';
  requestId: string;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ErrorEnvelope {
  kind: 'error';
  requestId?: string;
  message: string;
}

export interface BroadcastEnvelope {
  kind: 'broadcast';
  topic: string;
  payload?: unknown;
}

export type RelayEnvelope = RequestEnvelope | ResponseEnvelope | ErrorEnvelope | BroadcastEnvelope;

export interface RegisterPayload {
  role: 'host' | 'client';
  clientId: string;
  hostId?: string;
  /** Host access password: hosts set it, clients must match it. */
  accessPassword?: string;
  meta?: Record<string, unknown>;
}

export interface Ack {
  ok: boolean;
  error?: string;
}

export interface SendPayload {
  target: string;
  envelope: RelayEnvelope;
}

export interface ReceivePayload {
  from: string;
  envelope: RelayEnvelope;
}

export interface PeerStatusPayload {
  type: 'host:offline' | 'client:offline';
  peerId: string;
}
