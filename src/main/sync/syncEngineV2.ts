import mongoose from 'mongoose';
import crypto from 'node:crypto';
import type { RelayClient } from '../relay/relayClient';
import type { RequestEnvelope } from '../relay/protocol';
import SyncOperation from '../api/models/syncOperation';
import SyncConflict from '../api/models/syncConflict';
import SyncState from '../api/models/syncState';
import { SYNC_COLLECTIONS, SyncCollectionConfig } from './collectionConfig';
import type {
  SyncOperationPayload,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
} from './syncProtocol';

export type SyncEngineStatus = 'idle' | 'pulling' | 'pushing' | 'error';

export interface SyncStatusSnapshot {
  status: SyncEngineStatus;
  lastPullAt?: Date;
  lastPushAt?: Date;
  lastError?: string;
  pendingCount: number;
  conflictCount: number;
  isOnline: boolean;
}

const POLL_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 120_000;
/** Bump this when the sync protocol changes in a way that requires clients to re-pull everything. */
const CURRENT_SYNC_VERSION = 2;

export class SyncEngineV2 {
  private relay: RelayClient | null = null;

  private targetHostId = '';

  private online = false;

  private active = false;

  private timer: NodeJS.Timeout | null = null;

  private currentStatus: SyncEngineStatus = 'idle';

  private lastError = '';

  private lastPullAt?: Date;

  private lastPushAt?: Date;

  /** In-memory lock to prevent concurrent sync runs. */
  private running = false;

  /** True if an operation was recorded while a sync was already running. */
  private queuedTrigger = false;

  onStatusChange: (snapshot: SyncStatusSnapshot) => void = () => {};

  setRelayClient(relay: RelayClient, targetHostId: string): void {
    this.relay = relay;
    this.targetHostId = targetHostId;
  }

  setOnline(online: boolean): void {
    const wasOnline = this.online;
    this.online = online;
    if (online && !wasOnline) {
      this.notifyOperationRecorded();
    }
    this.broadcastStatus();
  }

  /**
   * Called whenever the sync recorder queues a new operation. Runs a sync
   * immediately if idle, otherwise schedules one to run as soon as the current
   * sync finishes so changes propagate to other devices with minimal delay.
   */
  notifyOperationRecorded(): void {
    if (this.running) {
      this.queuedTrigger = true;
      return;
    }
    this.triggerSync().catch(() => {});
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.runMigrations().catch(() => {});
    this.scheduleNextPoll();
    this.broadcastStatus();
  }

  private async runMigrations(): Promise<void> {
    const state = await this.ensureState();

    // If the local sync protocol version is older than the current code, reset
    // all collection cursors so the next pull re-fetches every document with
    // the new apply logic (e.g. preserving createdAt on fresh devices).
    if ((state.syncVersion || 0) < CURRENT_SYNC_VERSION) {
      console.log(`[sync:v2] upgrading sync version ${state.syncVersion || 0} -> ${CURRENT_SYNC_VERSION}; resetting pull cursors`);
      state.collectionCursors = {};
      state.markModified('collectionCursors');
      state.syncVersion = CURRENT_SYNC_VERSION;
      await state.save();
    }

    // Legacy SyncOperation records created before the v2 protocol did not have
    // a unique operation id. Assign one to each so they can be pushed.
    const legacyOps = await SyncOperation.find({ operationId: { $exists: false } }).lean();
    for (const op of legacyOps) {
      await SyncOperation.updateOne(
        { _id: op._id },
        { $set: { operationId: crypto.randomUUID() } },
      );
    }
    if (legacyOps.length > 0) {
      console.log(`[sync:v2] migrated ${legacyOps.length} legacy operations`);
    }
  }

  stop(): void {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async triggerSync(): Promise<void> {
    if (!this.online || !this.relay || !this.targetHostId) {
      return;
    }
    if (this.running) {
      return;
    }
    // Wait briefly for the relay to be registered. If it is not, skip silently
    // instead of logging a storm of errors during startup/reconnection.
    if (this.relay.getState() !== 'registered') {
      const becameRegistered = await this.waitForRegistered(3000);
      if (!becameRegistered) {
        return;
      }
    }

    this.running = true;
    this.lastError = '';
    this.broadcastStatus();

    try {
      // Pull first: if the server has newer state, learn it before pushing our
      // own changes. This reduces the chance of conflicts and ensures our base
      // sequence is as fresh as possible.
      await this.pullAll();
      await this.pushPending();
      await this.pullAll();
      await this.updateState();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.currentStatus = 'error';
      await this.updateState();
      this.broadcastStatus();
    } finally {
      this.running = false;
      // If an operation was recorded while we were busy, sync again right away
      // so the change is propagated immediately.
      if (this.queuedTrigger) {
        this.queuedTrigger = false;
        this.triggerSync().catch(() => {});
      }
    }
  }

  async getStatusSnapshot(): Promise<SyncStatusSnapshot> {
    const state = await this.ensureState();
    const pendingCount = await SyncOperation.countDocuments({ status: 'pending' });
    const conflictCount = await SyncConflict.countDocuments({ status: 'pending' });
    return {
      status: this.currentStatus,
      lastPullAt: state.lastPullAt || this.lastPullAt,
      lastPushAt: state.lastPushAt || this.lastPushAt,
      lastError: this.lastError || state.lastError,
      pendingCount,
      conflictCount,
      isOnline: this.online,
    };
  }

  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedDoc?: any,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const conflict = await SyncConflict.findById(conflictId);
      if (!conflict) return { ok: false, error: 'CONFLICT_NOT_FOUND' };

      conflict.status = resolution;
      if (resolution === 'merged' && mergedDoc) {
        conflict.mergedDoc = mergedDoc;
      }
      await conflict.save();

      if (resolution === 'local') {
        // Re-queue the local change so it is pushed again.
        await SyncOperation.updateOne(
          { _id: conflict.operationId },
          { $set: { status: 'pending', errorMessage: undefined, retryCount: 0 } },
        );
      } else if (resolution === 'remote' || resolution === 'merged') {
        const chosenDoc = resolution === 'merged' && mergedDoc ? mergedDoc : conflict.remoteDoc;
        await this.applyLocalDoc(conflict.collection, chosenDoc);
      }

      await this.updateState();
      this.broadcastStatus();
      this.triggerSync().catch(() => {});
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'RESOLVE_FAILED' };
    }
  }

  async getConflicts(): Promise<any[]> {
    return SyncConflict.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
  }

  private scheduleNextPoll(): void {
    if (!this.active) return;
    this.timer = setTimeout(() => {
      this.triggerSync().catch(() => {});
      this.scheduleNextPoll();
    }, POLL_INTERVAL_MS);
  }

  private async pushPending(): Promise<void> {
    if (!this.online || !this.relay || !this.targetHostId) return;
    this.currentStatus = 'pushing';
    this.broadcastStatus();

    const pending = await SyncOperation.find({ status: 'pending' }).sort({ createdAt: 1 });
    if (pending.length === 0) {
      this.currentStatus = 'idle';
      this.lastPushAt = new Date();
      await this.updateState();
      this.broadcastStatus();
      return;
    }

    const operations: SyncOperationPayload[] = pending.map((op) => ({
      operationId: op.operationId,
      documentId: op.documentId as string,
      collection: op.collection,
      method: op.method as any,
      baseSequence: op.baseSequence,
      baseUpdatedAt: op.baseUpdatedAt,
      body: op.body,
      path: op.path,
    }));

    const request: SyncPushRequest = { operations };

    try {
      const response = await this.request<SyncPushResponse>(
        this.targetHostId,
        'POST',
        '/api/v1/sync/v2/push',
        request,
      );

      for (const result of response.results) {
        const op = pending.find((p) => p.operationId === result.operationId);
        if (!op) continue;

        if (result.status === 'applied' || result.status === 'duplicate') {
          op.status = 'resolved';
          op.errorMessage = undefined;
          // If the server returned a document snapshot, update our local copy
          // so ids and server-side computed fields stay in sync.
          if (result.doc && result.status === 'applied') {
            await this.applyLocalDoc(op.collection, result.doc);
          }
        } else if (result.status === 'conflict') {
          await this.recordConflict(op, result.conflict?.remoteDoc);
          op.status = 'pending';
          op.errorMessage = 'CONFLICT';
        } else {
          op.retryCount += 1;
          op.status = op.retryCount >= 5 ? 'failed' : 'pending';
          op.errorMessage = result.error || `PUSH_ERROR_${result.status}`;
          this.lastError = `[sync:v2] push failed ${op.operationId}: ${op.errorMessage}`;
        }
        await op.save();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // NOT_REGISTERED is expected during brief disconnects; do not mark ops as
      // failed and do not spam logs.
      if (message === 'NOT_REGISTERED') {
        this.currentStatus = 'idle';
        this.broadcastStatus();
        return;
      }
      for (const op of pending) {
        op.retryCount += 1;
        op.status = op.retryCount >= 5 ? 'failed' : 'pending';
        op.errorMessage = message;
        await op.save();
      }
      this.lastError = `[sync:v2] push batch failed: ${message}`;
      throw error;
    }

    this.lastPushAt = new Date();
    this.currentStatus = 'idle';
    await this.updateState();
    this.broadcastStatus();
  }

  private async pullAll(): Promise<void> {
    if (!this.online || !this.relay || !this.targetHostId) return;
    this.currentStatus = 'pulling';
    this.broadcastStatus();

    const state = await this.ensureState();
    const cursors = state.collectionCursors || {};

    for (const collection of SYNC_COLLECTIONS) {
      try {
        await this.pullCollection(collection, cursors[collection.name] ?? 0);
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : String(error);
        // NOT_REGISTERED is expected during brief disconnects; do not spam logs.
        if (rawMessage === 'NOT_REGISTERED') {
          return;
        }
        const message = `[sync:v2] pull failed for ${collection.name}: ${rawMessage}`;
        console.error(message);
        this.lastError = message;
      }
    }

    this.lastPullAt = new Date();
    this.currentStatus = 'idle';
    await this.updateState();
    this.broadcastStatus();
  }

  private async pullCollection(collection: SyncCollectionConfig, cursor: number): Promise<void> {
    const Model = this.getLocalModel(collection.model);
    if (!Model) {
      console.warn(`[sync:v2] local model ${collection.model} not found`);
      return;
    }

    const pageSize = 200;
    let currentCursor = cursor;
    let hasMore = true;

    while (hasMore) {
      const authParam = collection.syncAuthFields ? '&includeAuth=true' : '';
      const response = await this.request<SyncPullResponse>(
        this.targetHostId,
        'GET',
        `/api/v1/sync/v2/pull/${collection.name}?cursor=${currentCursor}&limit=${pageSize}${authParam}`,
      );

      const docs = response.docs || [];
      hasMore = response.hasMore ?? false;
      currentCursor = response.nextCursor ?? response.maxSequence ?? currentCursor;

      // Skip documents that have pending local changes or unresolved conflicts.
      const pendingIds = await SyncOperation.find({
        status: { $in: ['pending', 'syncing'] },
        collection: collection.name,
      }).distinct('documentId');

      const conflictIds = await SyncConflict.find({
        status: 'pending',
        collection: collection.name,
      }).distinct('documentId');

      const skipIds = new Set([...pendingIds, ...conflictIds].filter(Boolean));

      for (const doc of docs) {
        const id = doc._id || doc.id;
        if (!id || skipIds.has(String(id))) continue;
        await this.applyLocalDoc(collection.name, doc);
      }

      await this.updateCollectionCursor(collection.name, currentCursor);
    }
  }

  private async applyLocalDoc(collectionName: string, doc: any): Promise<void> {
    const cfg = SYNC_COLLECTIONS.find((c) => c.name === collectionName);
    if (!cfg) return;
    const Model = this.getLocalModel(cfg.model);
    if (!Model) return;

    const id = doc._id || doc.id;
    if (!id) return;

    if (doc.__deleted) {
      await Model.findByIdAndDelete(id);
      return;
    }

    const cleanDoc = { ...doc };
    delete cleanDoc.__v;
    delete cleanDoc.sequence;

    try {
      const existing = await Model.findById(id).lean();
      if (!existing) {
        // Use create/save for new documents so Mongoose preserves the server
        // timestamps (especially createdAt). findByIdAndUpdate with upsert
        // would overwrite createdAt with the local clock.
        await new Model(cleanDoc).save();
      } else {
        await Model.findByIdAndUpdate(id, cleanDoc, { new: true });
      }
    } catch (error: any) {
      if (error?.code === 11000) {
        const resolved = await this.resolveDuplicateKeyConflict(Model, cfg, cleanDoc, error);
        if (resolved) return;
      }
      throw error;
    }
  }

  private async resolveDuplicateKeyConflict(
    Model: any,
    cfg: SyncCollectionConfig,
    remoteDoc: any,
    error: any,
  ): Promise<boolean> {
    const dupKey = this.parseDuplicateKey(error);
    if (!dupKey || Object.keys(dupKey).length === 0) return false;

    const localDoc = await Model.findOne(dupKey).lean();
    if (!localDoc) return false;
    const localId = String(localDoc._id);

    // If the local document has unsynced changes, do not overwrite it automatically.
    const hasPendingLocalChange = await SyncOperation.exists({
      status: { $in: ['pending', 'syncing'] },
      collection: cfg.name,
      documentId: localId,
    });
    if (hasPendingLocalChange) {
      console.log('[sync:v2] skipping pulled doc, local copy has pending changes', cfg.name, dupKey);
      return true;
    }

    const remoteUpdatedAt = new Date(remoteDoc.updatedAt || 0).getTime();
    const localUpdatedAt = new Date(localDoc.updatedAt || 0).getTime();

    if (remoteUpdatedAt > localUpdatedAt) {
      // Remote is newer: remove the local duplicate and insert the remote version.
      // This preserves the remote _id because it is the same logical record.
      await Model.findByIdAndDelete(localId);
      await Model.create(remoteDoc);
      console.log('[sync:v2] resolved duplicate key by keeping remote', cfg.name, dupKey);
      return true;
    }

    console.log('[sync:v2] resolved duplicate key by keeping local', cfg.name, dupKey);
    return true;
  }

  private parseDuplicateKey(error: any): Record<string, any> | null {
    if (error.keyValue && typeof error.keyValue === 'object') {
      return error.keyValue;
    }
    const message = error?.message || '';
    const match = message.match(/dup key:\s*(\{.*?\})\s*$/);
    if (!match) return null;
    try {
      return JSON.parse(match[1].replace(/([a-zA-Z0-9_]+):/g, '"$1":'));
    } catch {
      return null;
    }
  }

  private async recordConflict(operation: any, remoteDoc: any): Promise<void> {
    const localDoc = operation.body || {};
    await SyncConflict.findOneAndUpdate(
      { collection: operation.collection, documentId: operation.documentId, status: 'pending' },
      {
        collection: operation.collection,
        documentId: operation.documentId,
        operationId: operation._id,
        operationUuid: operation.operationId,
        localDoc,
        remoteDoc,
        status: 'pending',
      },
      { upsert: true, new: true },
    );
  }

  private async request<T>(targetHostId: string, method: string, path: string, body?: unknown): Promise<T> {
    if (!this.relay) throw new Error('RELAY_NOT_AVAILABLE');
    const registered = await this.waitForRegistered(10000);
    if (!registered) {
      throw new Error('NOT_REGISTERED');
    }

    const envelope: RequestEnvelope = {
      kind: 'request',
      requestId: crypto.randomUUID(),
      method,
      path,
      headers: { 'Content-Type': 'application/json' },
      body,
    };

    const response = await this.relay.request(targetHostId, envelope, REQUEST_TIMEOUT_MS);

    if (response.kind === 'error') {
      throw new Error(response.message || 'REQUEST_FAILED');
    }
    if (response.kind !== 'response') {
      throw new Error('UNEXPECTED_ENVELOPE');
    }
    if (response.status >= 400) {
      const bodyData = this.parseBody(response.body);
      throw new Error(bodyData?.message || `HTTP_${response.status}`);
    }
    return this.parseBody(response.body) as T;
  }

  private async waitForRegistered(timeoutMs: number): Promise<boolean> {
    if (!this.relay) return false;
    const start = Date.now();
    while (this.relay.getState() !== 'registered') {
      if (Date.now() - start > timeoutMs) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return true;
  }

  private parseBody(body: unknown): any {
    if (body === undefined || body === null) return undefined;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  }

  private getLocalModel(modelName: string): any {
    try {
      return mongoose.connection.models[modelName];
    } catch {
      return null;
    }
  }

  private async ensureState(): Promise<any> {
    return SyncState.findOneAndUpdate(
      { _id: 'global' },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async updateCollectionCursor(collection: string, cursor: number): Promise<void> {
    const state = await this.ensureState();
    const cursors = { ...(state.collectionCursors || {}) };
    cursors[collection] = Math.max(cursor, cursors[collection] ?? 0);
    state.collectionCursors = cursors;
    state.markModified('collectionCursors');
    state.updatedAt = new Date();
    await state.save();
  }

  private async updateState(): Promise<void> {
    const state = await this.ensureState();
    state.lastPullAt = this.lastPullAt || state.lastPullAt;
    state.lastPushAt = this.lastPushAt || state.lastPushAt;
    state.isPulling = this.currentStatus === 'pulling';
    state.isPushing = this.currentStatus === 'pushing';
    state.lastError = this.lastError || state.lastError;
    state.pendingCount = await SyncOperation.countDocuments({ status: 'pending' });
    state.conflictCount = await SyncConflict.countDocuments({ status: 'pending' });
    state.updatedAt = new Date();
    await state.save();
  }

  private async broadcastStatus(): Promise<void> {
    const snapshot = await this.getStatusSnapshot();
    this.onStatusChange(snapshot);
  }
}

export default SyncEngineV2;
