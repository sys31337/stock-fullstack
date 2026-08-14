import type { NextFunction, Request, Response } from 'express';
import SyncOperation from '@api/models/syncOperation';
import { getSyncCollectionByEndpoint } from '../../sync/collectionConfig';

let clientModeEnabled = false;

let onOperationRecorded: (() => void) | null = null;

export function setSyncRecorderClientMode(enabled: boolean): void {
  clientModeEnabled = enabled;
}

export function isSyncRecorderClientMode(): boolean {
  return clientModeEnabled;
}

export function setOnOperationRecorded(callback: () => void): void {
  onOperationRecorded = callback;
}

const EXACT_SKIP_PATHS = new Set([
  '/api/v1/users/login',
  '/api/v1/users/token',
  '/api/v1/users/logout',
  '/api/v1/users/current',
  '/api/v1/sync/pull',
  '/api/v1/sync/push',
  '/api/v1/sync/state',
  '/api/v1/sync/conflicts',
]);

const SKIP_PREFIXES = [
  '/api/v1/sync/',
];

function shouldSkip(path: string): boolean {
  if (EXACT_SKIP_PATHS.has(path)) return true;
  return SKIP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function extractEndpointAndId(path: string): { endpoint: string; documentId?: string } | null {
  const match = path.match(/^\/api\/v1\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;
  const endpoint = match[1];
  const maybeId = match[2];
  const cfg = getSyncCollectionByEndpoint(endpoint);
  if (!cfg) return null;
  return { endpoint: cfg.endpoint, documentId: maybeId && maybeId.length === 24 ? maybeId : undefined };
}

function normalizeBody(body: unknown): unknown {
  if (body === null || body === undefined) return undefined;
  if (typeof body !== 'object') return body;
  const clone = JSON.parse(JSON.stringify(body));
  // Strip runtime-only fields that should not be replayed to the host.
  // Keep updatedAt so the host can detect conflicts.
  delete clone._id;
  delete clone.createdAt;
  delete clone.__v;
  return clone;
}

/**
 * Express middleware that records mutating HTTP requests as pending sync
 * operations when running in client mode. The operation is queued after the
 * response has been sent so the generated _id from POST requests is captured.
 */
export function syncRecorderMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!clientModeEnabled) {
    next();
    return;
  }

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const pathInfo = extractEndpointAndId(req.path);
  console.log('[syncRecorder]', req.method, req.path, '->', pathInfo);
  if (!pathInfo || shouldSkip(req.path)) {
    next();
    return;
  }

  // Capture request details here; req.url/path may be mutated by routers
  // before the response finishes and queueOperation runs.
  const requestMethod = req.method;
  const requestPath = req.path;
  const requestHeaders = req.headers;
  const requestBody = req.body;

  const originalEnd = res.end.bind(res);
  const originalJson = res.json.bind(res);

  let responseBody: any;
  res.json = function json(body: any) {
    responseBody = body;
    return originalJson(body);
  };

  res.end = function end(chunk: any, encoding?: any, cb?: any) {
    res.end = originalEnd;
    if (!res.writableEnded) {
      originalEnd(chunk, encoding, cb);
    }
    queueOperation(requestMethod, requestPath, requestHeaders, res, pathInfo, responseBody, requestBody).catch((err) => {
      console.error('[syncRecorder] failed to queue operation', err);
    });
    return res;
  };

  next();
}

async function queueOperation(
  method: string,
  path: string,
  reqHeaders: Request['headers'],
  res: Response,
  pathInfo: { endpoint: string; documentId?: string },
  responseBody: any,
  requestBody: unknown,
): Promise<void> {
  if (res.statusCode >= 400) return;

  const cfg = getSyncCollectionByEndpoint(pathInfo.endpoint);
  if (!cfg) return;

  let documentId = pathInfo.documentId;

  // For POST requests the local DB generated the _id; capture it from the
  // response body so the host can receive the same id. Some controllers wrap
  // the result in a `data` or `result` field.
  if (method === 'POST' && responseBody && typeof responseBody === 'object') {
    const unwrap = (responseBody as any).data ?? (responseBody as any).result ?? responseBody;
    const bodyId = unwrap?._id || unwrap?.id;
    if (typeof bodyId === 'string' && bodyId.length === 24) {
      documentId = bodyId;
    }
  }

  // If a document was deleted locally there is no body to replay; send an
  // empty payload so the host can delete by id.
  const body = method === 'DELETE' ? undefined : normalizeBody(requestBody);

  const headers: Record<string, string> = {};
  const authHeader = reqHeaders.authorization;
  if (authHeader) headers.authorization = String(authHeader);

  // De-duplicate: if there is already a pending operation for the same
  // document and method, update it instead of creating another record.
  const existing = await SyncOperation.findOne({
    status: 'pending',
    collection: cfg.name,
    documentId,
  }).sort({ createdAt: -1 });

  if (existing && method !== 'POST') {
    existing.method = method as any;
    existing.body = body;
    existing.headers = headers;
    existing.path = path;
    existing.retryCount = 0;
    existing.errorMessage = undefined;
    await existing.save();
    console.log('[syncRecorder] updated existing', existing._id, existing.method, existing.path, existing.documentId);
    onOperationRecorded?.();
    return;
  }

  const op = await new SyncOperation({
    method,
    collection: cfg.name,
    path,
    documentId,
    body,
    headers,
    status: 'pending',
    retryCount: 0,
  }).save();
  console.log('[syncRecorder] queued', op._id, op.method, op.path, op.documentId);
  onOperationRecorded?.();
}
