import http from 'node:http';
import { URL } from 'node:url';
import { RelayClient } from './relayClient';
import { ReceivePayload, RelayEnvelope, RequestEnvelope } from './protocol';

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

  constructor(relay: RelayClient, localApiUrl: string, requestTimeoutMs = 60000) {
    this.relay = relay;
    this.localApiUrl = localApiUrl;
    this.requestTimeoutMs = requestTimeoutMs;
    this.relay.onReceive = (payload: ReceivePayload) => {
      const { envelope } = payload;
      if (envelope && envelope.kind === 'request' && payload.from) {
        this.handleRequest(payload.from, envelope).catch(() => {
          // handled inside; nothing to do
        });
      }
    };
  }

  private async handleRequest(requesterId: string, request: RequestEnvelope): Promise<void> {
    const { requestId, method, path } = request;

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

    const headers: Record<string, string> = { host: url.host, connection: 'close' };
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
