import type { Response, NextFunction } from 'express';
import http from 'node:http';
import mongoose from 'mongoose';
import type { IUserIdRequest } from '@api/types/common';
import { SYNC_COLLECTIONS } from '../../../main/sync/collectionConfig';

const LOCAL_API_URL = process.env.RELAY_LOCAL_API || 'http://127.0.0.1:3500';
const SYNC_TOKEN = process.env.SYNC_TOKEN || process.env.RELAY_TOKEN || 'change-me';

function isSyncAuthorized(req: IUserIdRequest): boolean {
  const header = req.headers['x-sync-token'];
  return typeof header === 'string' && header === SYNC_TOKEN;
}

interface PullResult {
  docs: any[];
  hasMore: boolean;
}

function getModel(name: string): mongoose.Model<any> | null {
  const cfg = SYNC_COLLECTIONS.find((c) => c.name === name);
  if (!cfg) return null;
  return mongoose.connection.models[cfg.model] || null;
}

function normalizeDoc(doc: any, includeAuthFields = false): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  if (!includeAuthFields) {
    delete obj.password;
    delete obj.salt;
    delete obj.refreshToken;
    delete obj.twoFactorSecret;
  }
  return obj;
}

export const pullCollection = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    if (!isSyncAuthorized(req)) {
      return res.status(403).send({ message: 'INVALID_SYNC_TOKEN' });
    }
    const { collection } = req.params;
    const { since, page = '1', limit = '200', includeAuth } = req.query;

    const Model = getModel(collection);
    if (!Model) {
      return res.status(404).send({ message: 'Unknown collection' });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (since && typeof since === 'string') {
      filter.updatedAt = { $gte: new Date(since) };
    }

    const docs = await Model.find(filter)
      .sort({ updatedAt: 1 })
      .skip(skip)
      .limit(limitNum + 1)
      .lean();

    const hasMore = docs.length > limitNum;
    if (hasMore) docs.pop();

    const includeAuthFields = includeAuth === 'true' && collection === 'users';
    const result: PullResult = {
      docs: docs.map((d) => normalizeDoc(d, includeAuthFields)),
      hasMore,
    };

    return res.status(200).send(result);
  } catch (error) {
    return next(error);
  }
};

export const pushOperation = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    if (!isSyncAuthorized(req)) {
      return res.status(403).send({ message: 'INVALID_SYNC_TOKEN' });
    }
    const { method, path, body, headers } = req.body;
    if (!method || !path) {
      return res.status(400).send({ message: 'Missing method or path' });
    }

    // Conflict detection: for updates/deletes compare the target document's
    // current updatedAt with the base updatedAt carried in the operation body.
    const conflictCheck = await detectConflict(method, path, body);
    if (conflictCheck.conflict) {
      return res.status(409).send({
        conflict: true,
        remoteDoc: conflictCheck.remoteDoc,
        message: 'Document was modified on the host since the last sync',
      });
    }

    // Replay the request against the local Express API authenticated with the
    // sync token. The auth middleware maps sync-token requests to the main
    // admin account so business logic and audit logs keep working even when
    // the client and host do not share the same JWT secret.
    const replayHeaders: Record<string, string> = { ...headers };
    delete replayHeaders.authorization;
    replayHeaders.authorization = `Bearer ${SYNC_TOKEN}`;

    const response = await replayLocalRequest(method, path, body, replayHeaders);

    return res.status(response.status).set(response.headers).send(response.body);
  } catch (error) {
    return next(error);
  }
};

async function detectConflict(method: string, path: string, body: unknown): Promise<{ conflict: boolean; remoteDoc?: any }> {
  if (!['PUT', 'PATCH', 'DELETE'].includes(method)) return { conflict: false };

  const match = path.match(/^\/api\/v1\/[^/]+\/([0-9a-fA-F]{24})$/);
  if (!match) return { conflict: false };
  const id = match[1];

  const endpoint = path.match(/^\/api\/v1\/([^/]+)/)?.[1];
  if (!endpoint) return { conflict: false };

  const cfg = SYNC_COLLECTIONS.find((c) => c.endpoint === endpoint || c.name === endpoint);
  if (!cfg) return { conflict: false };

  const Model = mongoose.connection.models[cfg.model];
  if (!Model) return { conflict: false };

  const current = await Model.findById(id).lean();
  if (!current) {
    // Deleting a missing document is fine; updating it is a conflict we report
    // as a missing-doc error so the client can decide.
    if (method === 'DELETE') return { conflict: false };
    return { conflict: true, remoteDoc: null };
  }

  const baseUpdatedAt = (body as any)?.updatedAt;
  if (!baseUpdatedAt) return { conflict: false };

  const baseDate = new Date(baseUpdatedAt);
  const currentDate = new Date((current as any).updatedAt || 0);

  if (currentDate.getTime() > baseDate.getTime()) {
    return { conflict: true, remoteDoc: normalizeDoc(current, cfg.syncAuthFields) };
  }

  return { conflict: false };
}

interface ReplayResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

function replayLocalRequest(
  method: string,
  apiPath: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<ReplayResponse> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined && body !== null ? JSON.stringify(body) : '';
    const url = new URL(apiPath, LOCAL_API_URL);
    const request = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed: any = raw;
          try {
            parsed = raw ? JSON.parse(raw) : undefined;
          } catch {
            // keep raw string
          }
          resolve({
            status: response.statusCode || 200,
            headers: { 'content-type': response.headers['content-type'] as string || 'application/json' },
            body: parsed,
          });
        });
      },
    );

    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

export const getSyncState = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    if (!isSyncAuthorized(req)) {
      return res.status(403).send({ message: 'INVALID_SYNC_TOKEN' });
    }
    return res.status(200).send({ now: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
};
