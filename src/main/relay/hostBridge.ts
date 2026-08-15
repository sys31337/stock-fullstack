import http from 'node:http';
import { URL } from 'node:url';
import crypto from 'node:crypto';
import { RelayClient } from './relayClient';
import { ReceivePayload, RelayEnvelope, RequestEnvelope, RelayHostInfo } from './protocol';

const FORWARD_HEADERS = ['authorization', 'accept-language', 'accept', 'content-type', 'x-public'];

/**
 * Host role. Receives request envelopes from the relay and re-issues them
 * against this machine's own Express backend, then relays the response back.
 * The Electron backend remains the single source of truth.
 */
export class HostBridge {
  private relay: RelayClient;

  private localApiUrl: string;

  private requestTimeoutMs: number;

  private connectedClients: string[] = [];

  constructor(relay: RelayClient, localApiUrl: string, requestTimeoutMs = 60000) {
    this.relay = relay;
    this.localApiUrl = localApiUrl;
    this.requestTimeoutMs = requestTimeoutMs;

    const originalReceive = this.relay.onReceive;
    this.relay.onReceive = (payload: ReceivePayload) => {
      const { envelope, from } = payload;
      if (envelope && envelope.kind === 'request' && from) {
        this.handleRequest(from, envelope).catch(() => {
          // handled inside; nothing to do
        });
      } else {
        originalReceive(payload);
      }
    };

    const ownClientId = this.relay.getPayload().clientId;
    const originalHostsChange = this.relay.onHostsChange;
    this.relay.onHostsChange = (hosts: RelayHostInfo[]) => {
      const ownHost = hosts.find((h) => h.clientId === ownClientId);
      // Prefer this host's own linked clients. Some relay implementations only
      // return the requesting host's entry; others return every host. If our
      // own entry is missing, fall back to all clients in the list so broadcasts
      // do not silently stop working.
      this.connectedClients = ownHost
        ? (ownHost.clients || [])
        : hosts.flatMap((h) => h.clients || []);
      originalHostsChange(hosts);
    };
  }

  /**
   * Broadcast a lightweight notification to every connected linked client so
   * they can pull missed changes immediately instead of waiting for the poll.
   * The relay protocol only guarantees forwarding of request/response envelopes,
   * so we encode the notification as a request to a virtual sync endpoint.
   */
  async broadcast(topic: string, payload?: unknown, excludeClientId?: string): Promise<void> {
    const ownClientId = this.relay.getPayload().clientId;
    try {
      const hosts = await this.relay.listHosts();
      const ownHost = hosts.find((h) => h.clientId === ownClientId);
      this.connectedClients = ownHost
        ? (ownHost.clients || [])
        : hosts.flatMap((h) => h.clients || []);
    } catch {
      // keep cached list if the relay is momentarily unreachable
    }
    const targets = this.connectedClients.filter((id) => id && id !== excludeClientId);
    console.log(`[host-bridge] broadcasting topic=${topic} to ${targets.length} client(s)`, targets);
    if (targets.length === 0) return;

    const envelope: RequestEnvelope = {
      kind: 'request',
      requestId: crypto.randomUUID(),
      method: 'POST',
      path: '/__sync__/notify',
      headers: { 'x-sync-topic': topic },
      body: payload,
    };
    await Promise.all(
      targets.map((clientId) =>
        this.relay
          .send(clientId, envelope)
          .then(() => console.log(`[host-bridge] notify sent to ${clientId}`))
          .catch((err: Error) => console.warn(`[host-bridge] notify failed to ${clientId}:`, err.message)),
      ),
    );
  }

  private async handleRequest(requesterId: string, request: RequestEnvelope): Promise<void> {
    const { requestId, method, path } = request;

    // Virtual sync notifications are handled by the client; do not forward.
    if (path === '/__sync__/notify') {
      return;
    }

    const respond = (envelope: RelayEnvelope): void => {
      this.relay.send(requesterId, envelope).catch(() => {
        // requester went offline; nothing to do
      });
    };

    let url: URL;
    try {
      url = new URL(path, this.localApiUrl);
    } catch {
      return respond({
        kind: 'error',
        requestId,
        message: 'INVALID_PATH',
      });
    }

    const headers: Record<string, string> = {
      host: url.host,
      connection: 'close',
      // Mark this request as coming from a linked client through the relay.
      // The local API uses this header to authorize relay-forwarded traffic
      // (the client and host may not share the same JWT secret).
      'x-relay-origin': requesterId,
    };
    for (const header of FORWARD_HEADERS) {
      const value = request.headers?.[header];
      if (value) headers[header] = value;
    }

    const body = request.body !== undefined ? JSON.stringify(request.body) : undefined;
    if (body) {
      headers['content-type'] = headers['content-type'] || 'application/json';
      headers['content-length'] = String(Buffer.byteLength(body));
    }

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let responseBody: unknown = raw;
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json') && raw.length > 0) {
            try {
              responseBody = JSON.parse(raw);
            } catch {
              responseBody = raw;
            }
          }
          respond({
            kind: 'response',
            requestId,
            status: res.statusCode || 500,
            headers: { 'content-type': contentType },
            body: responseBody,
          });
        });
      },
    );

    req.setTimeout(this.requestTimeoutMs, () => {
      req.destroy(new Error('REQUEST_TIMEOUT'));
    });

    req.on('error', (err: NodeJS.ErrnoException) => {
      respond({
        kind: 'error',
        requestId,
        message: err.code === 'REQUEST_TIMEOUT' ? 'REQUEST_TIMEOUT' : 'HOST_UNAVAILABLE',
      });
    });

    if (body) req.write(body);
    req.end();
  }
}
