import { io, Socket } from 'socket.io-client';
import {
  Ack,
  PeerStatusPayload,
  ReceivePayload,
  RegisterPayload,
  RELAY_EVENTS,
  RELAY_TOKEN_KEY,
  RelayEnvelope,
  RelayHostInfo,
  SendPayload,
} from './protocol';

export type RelayState = 'idle' | 'connecting' | 'connected' | 'registered' | 'auth-error' | 'error' | 'closed';

export interface RelayClientOptions {
  url: string;
  token: string;
  payload: RegisterPayload;
  requestTimeoutMs?: number;
  onStateChange?: (state: RelayState) => void;
  onHostsChange?: (hosts: RelayHostInfo[]) => void;
  onReceive?: (payload: ReceivePayload) => void;
  onPeerStatus?: (payload: PeerStatusPayload) => void;
}

interface PendingRequest {
  resolve: (envelope: RelayEnvelope) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

const noop = (): void => {};

/**
 * socket.io client used by BOTH the Electron main process and the React Native
 * app. It talks the exact protocol implemented by solustock-relay and exposes
 * a request/response round trip on top of the relay's message forwarding.
 */
export class RelayClient {
  private socket: Socket | null = null;

  private opts: RelayClientOptions;

  private state: RelayState = 'idle';

  private pending = new Map<string, PendingRequest>();

  private hosts: RelayHostInfo[] = [];

  private lastRegisterError = '';

  private closed = false;

  onStateChange: (state: RelayState) => void;

  onHostsChange: (hosts: RelayHostInfo[]) => void;

  onReceive: (payload: ReceivePayload) => void;

  onPeerStatus: (payload: PeerStatusPayload) => void;

  constructor(opts: RelayClientOptions) {
    this.opts = opts;
    this.onStateChange = opts.onStateChange ?? noop;
    this.onHostsChange = opts.onHostsChange ?? noop;
    this.onReceive = opts.onReceive ?? noop;
    this.onPeerStatus = opts.onPeerStatus ?? noop;
  }

  getState(): RelayState {
    return this.state;
  }

  isRegistered(): boolean {
    return this.state === 'registered';
  }

  getHosts(): RelayHostInfo[] {
    return this.hosts;
  }

  getLastRegisterError(): string {
    return this.lastRegisterError;
  }

  connect(): void {
    if (this.closed) throw new Error('RelayClient is closed');
    if (this.socket) return;

    this.setState('connecting');
    const options: Record<string, unknown> = {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
      auth: { [RELAY_TOKEN_KEY]: this.opts.token },
      maxHttpBufferSize: 10 * 1024 * 1024,
    };
    const socket = io(this.opts.url, options as Parameters<typeof io>[1]);
    this.socket = socket;

    socket.on('connect', () => {
      this.setState('connected');
      this.register().catch(() => {});
    });

    socket.on('connect_error', (err: Error & { data?: { code?: string } }) => {
      if (err.data?.code === 'UNAUTHORIZED') {
        socket.disconnect();
        this.setState('auth-error');
      } else {
        this.setState('error');
      }
    });

    socket.on('disconnect', () => {
      if (this.closed) return;
      this.rejectAll(new Error('RELAY_DISCONNECTED'));
      this.setState('connecting');
    });

    socket.on(RELAY_EVENTS.RECEIVE, (payload: ReceivePayload) => this.handleReceive(payload));
    socket.on(RELAY_EVENTS.HOSTS_UPDATE, (hosts: RelayHostInfo[]) => {
      this.hosts = hosts;
      this.onHostsChange(hosts);
    });
    socket.on(RELAY_EVENTS.PEER_STATUS, (payload: PeerStatusPayload) => this.onPeerStatus(payload));
  }

  disconnect(): void {
    this.closed = true;
    this.rejectAll(new Error('RELAY_CLOSED'));
    this.socket?.disconnect();
    this.socket = null;
    this.setState('closed');
  }

  /**
   * Fire-and-forget send; resolves once the relay accepted and forwarded the
   * message (ack { ok: true }), rejects on TARGET_OFFLINE / FORBIDDEN / etc.
   */
  send(target: string, envelope: RelayEnvelope): Promise<void> {
    return this.emitSend(target, envelope);
  }

  /**
   * Full round trip: send the envelope to `target` and resolve with the
   * matching response envelope (or reject on relay error / timeout).
   */
  request(target: string, envelope: RelayEnvelope, timeoutMs?: number): Promise<RelayEnvelope> {
    if (typeof envelope.requestId !== 'string' || envelope.requestId.length === 0) {
      return Promise.reject(new Error('INVALID_REQUEST_ID'));
    }
    if (this.state !== 'registered') {
      return Promise.reject(new Error('NOT_CONNECTED'));
    }
    const requestId = envelope.requestId;
    const timeout = timeoutMs ?? this.opts.requestTimeoutMs ?? 60000;

    return new Promise<RelayEnvelope>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error('RELAY_TIMEOUT'));
      }, timeout);
      this.pending.set(requestId, {
        resolve,
        reject,
        timer,
      });
      this.emitSend(target, envelope).catch((err: Error) => {
        this.pending.delete(requestId);
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  listHosts(): Promise<RelayHostInfo[]> {
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('NOT_CONNECTED'));
    }
    return new Promise<RelayHostInfo[]>((resolve) => {
      this.socket?.emit(RELAY_EVENTS.HOSTS_LIST, (hosts: RelayHostInfo[]) => resolve(hosts ?? []));
    });
  }

  private emitSend(target: string, envelope: RelayEnvelope): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      return Promise.reject(new Error('NOT_CONNECTED'));
    }
    return new Promise<void>((resolve, reject) => {
      const payload: SendPayload = { target, envelope };
      this.socket?.emit(RELAY_EVENTS.SEND, payload, (ack: Ack) => {
        if (ack?.ok) return resolve();
        return reject(new Error(ack?.error || 'RELAY_SEND_FAILED'));
      });
    });
  }

  private register(): Promise<void> {
    if (!this.socket) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      this.socket?.emit(RELAY_EVENTS.REGISTER, this.opts.payload, (ack: Ack) => {
        if (ack?.ok) {
          this.lastRegisterError = '';
          this.setState('registered');
          resolve();
        } else {
          this.lastRegisterError = ack?.error || 'REGISTER_FAILED';
          this.setState('error');
          reject(new Error(ack?.error || 'REGISTER_FAILED'));
        }
      });
    });
  }

  private handleReceive(payload: ReceivePayload): void {
    const { envelope } = payload;
    if (!envelope) return;
    if (envelope.kind === 'response' || envelope.kind === 'error') {
      const requestId = envelope.requestId;
      if (typeof requestId === 'string') {
        const pending = this.pending.get(requestId);
        if (pending) {
          this.pending.delete(requestId);
          clearTimeout(pending.timer);
          if (envelope.kind === 'response') {
            pending.resolve(envelope);
          } else {
            pending.reject(new Error(envelope.message));
          }
          return;
        }
      }
    }
    this.onReceive(payload);
  }

  private rejectAll(err: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(err);
    }
    this.pending.clear();
  }

  private setState(state: RelayState): void {
    this.state = state;
    this.onStateChange(state);
  }
}
