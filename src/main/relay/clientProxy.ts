import http from 'node:http';
import crypto from 'node:crypto';
import { RelayClient } from './relayClient';
import { RelayEnvelope, RequestEnvelope } from './protocol';

const FORWARD_HEADERS = ['authorization', 'accept-language', 'accept', 'content-type', 'x-public'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept-Language',
  'Access-Control-Expose-Headers': 'Content-Disposition',
};

/**
 * Client role. Runs a tiny local HTTP proxy (default port 4032) so the
 * existing renderer keeps making normal HTTP calls against /api/*. The proxy
 * tunnels each request through the relay to the remote host and streams the
 * response back. No business logic lives here.
 */
export class ClientProxy {
  private relay: RelayClient;

  private targetHostId: string;

  private port: number;

  private server: http.Server | null = null;

  constructor(relay: RelayClient, port: number, targetHostId: string) {
    this.relay = relay;
    this.port = port;
    this.targetHostId = targetHostId;
  }

  start(): http.Server {
    if (this.server) return this.server;
    this.server = http.createServer((req, res) => {
      this.handle(req, res);
    });
    this.server.listen(this.port, '127.0.0.1');
    return this.server;
  }

  stop(): void {
    this.server?.close();
    this.server = null;
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', CORS['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', CORS['Access-Control-Allow-Methods']);
    res.setHeader('Access-Control-Allow-Headers', CORS['Access-Control-Allow-Headers']);
    res.setHeader('Access-Control-Expose-Headers', CORS['Access-Control-Expose-Headers']);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'PROXY_ERROR' }));
      }
    });
    req.on('end', async () => {
      const raw = Buffer.concat(chunks);
      let body: unknown;
      const contentType = String(req.headers['content-type'] || '');
      if (contentType.includes('application/json') && raw.length > 0) {
        try {
          body = JSON.parse(raw.toString('utf8'));
        } catch {
          body = raw.toString('utf8');
        }
      } else if (raw.length > 0) {
        body = raw.toString('utf8');
      }

      const headers: Record<string, string> = {};
      for (const header of FORWARD_HEADERS) {
        const value = req.headers[header];
        if (value) headers[header] = String(value);
      }

      const envelope: RequestEnvelope = {
        kind: 'request',
        requestId: crypto.randomUUID(),
        method: req.method || 'GET',
        path: req.url || '/',
        headers,
        body,
      };

      try {
        const response = await this.relay.request(this.targetHostId, envelope);
        this.writeResponse(res, response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'RELAY_ERROR';
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Relay unavailable (${message})` }));
        }
      }
    });
  }

  private writeResponse(res: http.ServerResponse, envelope: RelayEnvelope): void {
    if (envelope.kind === 'error') {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: envelope.message }));
      }
      return;
    }
    if (envelope.kind !== 'response') {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Unexpected envelope' }));
      return;
    }
    const contentType = envelope.headers?.['content-type'] || 'application/json';
    res.writeHead(envelope.status, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': CORS['Access-Control-Allow-Origin'],
      'Access-Control-Expose-Headers': CORS['Access-Control-Expose-Headers'],
    });
    if (envelope.body !== undefined) {
      res.end(typeof envelope.body === 'string' ? envelope.body : JSON.stringify(envelope.body));
    } else {
      res.end();
    }
  }
}
