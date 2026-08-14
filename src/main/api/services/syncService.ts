import mongoose from 'mongoose';
import http from 'node:http';
import { URL } from 'node:url';
import { SYNC_COLLECTIONS } from '../../sync/collectionConfig';
import SyncAppliedOperation from '@api/models/syncAppliedOperation';
import SyncConflict from '@api/models/syncConflict';
import {
  recordChange,
  pullChanges,
  getGlobalMaxSequence,
} from './syncChangeLogService';
import { withSyncReplay } from '@api/plugins/syncChangeTracking';
import syncBroadcaster from '../../sync/syncBroadcaster';
import type {
  SyncOperationPayload,
  SyncPushResult,
  SyncPushResponse,
  SyncPullResponse,
} from '../../sync/syncProtocol';

const LOCAL_API_URL = process.env.RELAY_LOCAL_API || 'http://127.0.0.1:3500';

interface ReplayResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

function getModel(collectionName: string): mongoose.Model<any> | null {
  const cfg = SYNC_COLLECTIONS.find((c) => c.name === collectionName);
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
            status: response.statusCode || 500,
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

function methodToOperation(method: string): 'create' | 'update' | 'delete' {
  if (method === 'POST') return 'create';
  if (method === 'DELETE') return 'delete';
  return 'update';
}

function isRelayRequest(req: { headers: http.IncomingHttpHeaders }): boolean {
  const origin = req.headers['x-relay-origin'];
  return typeof origin === 'string' && origin.length > 0;
}

/**
 * Detects whether applying `op` on the server would conflict with a more
 * recent server-side change. Conflicts are based on the base sequence/updatedAt
 * carried by the peer.
 */
async function detectConflict(op: SyncOperationPayload): Promise<{ conflict: boolean; remoteDoc?: any; message?: string }> {
  if (op.method === 'POST') {
    // Creating a document whose _id already exists is a conflict if the content
    // differs from what is already stored.
    const Model = getModel(op.collection);
    if (!Model) return { conflict: false };
    const existing = await Model.findById(op.documentId).lean();
    if (!existing) return { conflict: false };

    const incoming = op.body || {};
    const incomingUpdatedAt = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;
    const existingUpdatedAt = (existing as any).updatedAt ? new Date((existing as any).updatedAt).getTime() : 0;

    // Same originating operation replayed: not a conflict (idempotency).
    if (incomingUpdatedAt && existingUpdatedAt && incomingUpdatedAt === existingUpdatedAt) {
      return { conflict: false };
    }

    // If the existing document is newer than the base the peer used, flag conflict.
    const baseUpdatedAt = op.baseUpdatedAt ? new Date(op.baseUpdatedAt).getTime() : 0;
    if (baseUpdatedAt && existingUpdatedAt > baseUpdatedAt) {
      return {
        conflict: true,
        remoteDoc: normalizeDoc(existing),
        message: 'Document already exists on the host and was modified after the base version',
      };
    }

    // If no base information and content is identical, treat as duplicate.
    return { conflict: false };
  }

  if (!['PUT', 'PATCH', 'DELETE'].includes(op.method)) {
    return { conflict: false };
  }

  const Model = getModel(op.collection);
  if (!Model) {
    if (op.method === 'DELETE') return { conflict: false };
    return { conflict: true, remoteDoc: null, message: 'Collection not found on host' };
  }

  const current = await Model.findById(op.documentId).lean();
  if (!current) {
    if (op.method === 'DELETE') return { conflict: false };
    return { conflict: true, remoteDoc: null, message: 'Document does not exist on host' };
  }

  const baseUpdatedAt = op.baseUpdatedAt ? new Date(op.baseUpdatedAt).getTime() : 0;
  const currentUpdatedAt = (current as any).updatedAt ? new Date((current as any).updatedAt).getTime() : 0;

  if (baseUpdatedAt && currentUpdatedAt > baseUpdatedAt) {
    return {
      conflict: true,
      remoteDoc: normalizeDoc(current),
      message: 'Document was modified on the host since the last sync',
    };
  }

  return { conflict: false };
}

async function recordPushResult(
  op: SyncOperationPayload,
  statusCode: number,
  responseBody: any,
  sequence?: number,
): Promise<void> {
  await SyncAppliedOperation.create({
    operationId: op.operationId,
    collection: op.collection,
    documentId: op.documentId,
    method: op.method,
    statusCode,
    responseBody,
    sequence,
    appliedAt: new Date(),
  });
}

async function fetchCurrentDoc(collection: string, documentId: string): Promise<any> {
  const Model = getModel(collection);
  if (!Model) return null;
  const doc = await Model.findById(documentId).lean();
  return doc ? normalizeDoc(doc) : null;
}

async function recordConflict(
  op: SyncOperationPayload,
  remoteDoc: any,
  message: string,
): Promise<void> {
  const localSnapshot = op.body || {};
    // Upsert a pending conflict entry so the user can resolve it.
  await SyncConflict.findOneAndUpdate(
    { collection: op.collection, documentId: op.documentId, status: 'pending' },
    {
      collection: op.collection,
      documentId: op.documentId,
      operationUuid: op.operationId,
      localDoc: localSnapshot,
      remoteDoc,
      status: 'pending',
      mergedDoc: { conflictMessage: message },
    },
    { upsert: true, new: true },
  );
}

export async function pushOperations(
  req: { headers: http.IncomingHttpHeaders },
  operations: SyncOperationPayload[],
  sourceClientId?: string,
): Promise<SyncPushResponse> {
  if (!isRelayRequest(req)) {
    throw new Error('NOT_A_RELAY_REQUEST');
  }

  const results: SyncPushResult[] = [];
  const relayOrigin = req.headers['x-relay-origin'] as string;

  for (const op of operations) {
    try {
      // 1. Idempotency: exact replay of an already applied operation returns the
      //    cached result without re-executing business logic.
      const alreadyApplied = await SyncAppliedOperation.findOne({ operationId: op.operationId }).lean();
      if (alreadyApplied) {
        results.push({
          operationId: op.operationId,
          status: alreadyApplied.statusCode === 200 || alreadyApplied.statusCode === 201 ? 'duplicate' : 'error',
          sequence: alreadyApplied.sequence,
          doc: alreadyApplied.responseBody,
        });
        continue;
      }

      // 2. Conflict detection.
      const conflictCheck = await detectConflict(op);
      if (conflictCheck.conflict) {
        await recordConflict(op, conflictCheck.remoteDoc, conflictCheck.message || 'Conflict detected');
        results.push({
          operationId: op.operationId,
          status: 'conflict',
          doc: conflictCheck.remoteDoc,
          conflict: {
            remoteDoc: conflictCheck.remoteDoc,
            message: conflictCheck.message || 'Conflict detected',
          },
        });
        continue;
      }

      // 3. Replay the mutation against the local API as the relay origin.
      const cfg = SYNC_COLLECTIONS.find((c) => c.name === op.collection);
      const apiPath = op.path || (cfg ? `/api/v1/${cfg.endpoint}/${op.documentId}` : '');
      const replayHeaders: Record<string, string> = {
        'x-relay-origin': relayOrigin,
      };

      const response = await withSyncReplay(() => replayLocalRequest(op.method, apiPath, op.body, replayHeaders));

      // 4. Record the change log entry for broadcast / cursor-based pull.
      let sequence: number | undefined;
      if (response.status >= 200 && response.status < 300) {
        const operation = methodToOperation(op.method);
        const docSnapshot = operation === 'delete' ? undefined : (await fetchCurrentDoc(op.collection, op.documentId));
        sequence = await recordChange({
          collection: op.collection,
          documentId: op.documentId,
          operation,
          operationId: op.operationId,
          sourceClientId: sourceClientId || relayOrigin,
          docSnapshot,
          isHostOrigin: false,
        });
      }

      await recordPushResult(op, response.status, response.body, sequence);

      // Notify other peers that new changes are available.
      if (sequence !== undefined) {
        syncBroadcaster.emitChange(sequence, sourceClientId).catch(() => {});
      }

      results.push({
        operationId: op.operationId,
        status: response.status >= 200 && response.status < 300 ? 'applied' : 'error',
        sequence,
        doc: response.body,
        error: response.status >= 400 ? (response.body?.message || `HTTP_${response.status}`) : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        operationId: op.operationId,
        status: 'error',
        error: message,
      });
    }
  }

  return {
    results,
    maxSequence: await getGlobalMaxSequence(),
  };
}

export async function pullCollectionChanges(
  req: { headers: http.IncomingHttpHeaders; query: any },
  collection: string,
): Promise<SyncPullResponse> {
  if (!isRelayRequest(req)) {
    throw new Error('NOT_A_RELAY_REQUEST');
  }

  const cursor = typeof req.query.cursor === 'string' ? parseInt(req.query.cursor, 10) : 0;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 200;
  const includeAuth = req.query.includeAuth === 'true';

  const { changes, hasMore, maxSequence, nextCursor } = await pullChanges({
    collection,
    cursor: Number.isNaN(cursor) ? 0 : cursor,
    limit: Number.isNaN(limit) ? 200 : limit,
  });

  // Hydrate create/update snapshots from the actual document collection so the
  // peer always receives the full current document. If a document no longer
  // exists, emit a delete marker instead of a stale snapshot — this prevents
  // deleted records from reappearing on clients when the change log is missing
  // the corresponding delete entry.
  const Model = getModel(collection);
  const docs: any[] = [];
  if (Model) {
    for (const change of changes) {
      if (change.operation === 'delete') {
        docs.push({ _id: change.documentId, __deleted: true, sequence: change.sequence });
        continue;
      }
      const current = await Model.findById(change.documentId).lean();
      if (current) {
        const normalized = normalizeDoc(current, includeAuth && collection === 'users');
        docs.push({ ...normalized, sequence: change.sequence });
      } else {
        docs.push({ _id: change.documentId, __deleted: true, sequence: change.sequence });
      }
    }
  } else {
    for (const change of changes) {
      if (change.operation === 'delete' || change.doc?.__deleted) {
        docs.push({ _id: change.documentId, __deleted: true, sequence: change.sequence });
      } else if (change.doc) {
        docs.push({ ...change.doc, sequence: change.sequence });
      }
    }
  }

  return { docs, hasMore, maxSequence, nextCursor };
}

/**
 * Records a host-side mutation in the change log. Called by host-mode change
 * tracking so locally created/updated/deleted documents are broadcast to peers.
 */
export async function recordHostChange(
  collection: string,
  documentId: string,
  operation: 'create' | 'update' | 'delete',
  docSnapshot?: any,
): Promise<number> {
  const sequence = await recordChange({
    collection,
    documentId,
    operation,
    docSnapshot,
    isHostOrigin: true,
  });
  return sequence;
}
