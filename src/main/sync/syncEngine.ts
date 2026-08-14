import mongoose from 'mongoose';
import crypto from 'node:crypto';
import type { RelayClient } from '../relay/relayClient';
import type { RelayEnvelope, RequestEnvelope } from '../relay/protocol';
import SyncOperation from '../api/models/syncOperation';
import SyncConflict from '../api/models/syncConflict';
import SyncState from '../api/models/syncState';
import { SYNC_COLLECTIONS, SyncCollectionConfig, getSyncCollectionByName } from './collectionConfig';

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

export class SyncEngine {
  private relay: RelayClient | null = null;

  private targetHostId = '';

  private online = false;

  private active = false;

  private timer: NodeJS.Timeout | null = null;

  private currentStatus: SyncEngineStatus = 'idle';

  private lastError = '';

  private lastPullAt?: Date;

  private lastPushAt?: Date;

  onStatusChange: (snapshot: SyncStatusSnapshot) => void = () => {};

  setRelayClient(relay: RelayClient, targetHostId: string): void {
    this.relay = relay;
    this.targetHostId = targetHostId;
  }

  setOnline(online: boolean): void {
    const wasOnline = this.online;
    this.online = online;
    if (online && !wasOnline) {
      this.triggerSync().catch(() => {});
    }
    this.broadcastStatus();
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.migrateLegacyPaths().catch(() => {});
    this.scheduleNextPoll();
    this.broadcastStatus();
  }

  private async migrateLegacyPaths(): Promise<void> {
    try {
      const ops = await SyncOperation.find({ status: 'pending' }).lean();
      for (const op of ops) {
        if (!op.path || op.path.startsWith('/api/v1/')) continue;
        const cfg = getSyncCollectionByName(op.collection);
        if (!cfg) continue;
        const suffix = op.path.startsWith('/') ? op.path : `/${op.path}`;
        const fixedPath = `/api/v1/${cfg.endpoint}${suffix}`;
        console.log('[sync] migrating legacy path', op.path, '->', fixedPath);
        await SyncOperation.updateOne({ _id: op._id }, { path: fixedPath });
      }
    } catch (err) {
      console.error('[sync] migrateLegacyPaths failed', err);
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
      console.log(`[sync] skipped: online=${this.online} relay=${!!this.relay} targetHostId=${this.targetHostId || '(none)'}`);
      return;
    }
    if (this.currentStatus !== 'idle') {
      console.log(`[sync] skipped: already ${this.currentStatus}`);
      return;
    }

    // Reset last error at the start of a manual/auto sync so the UI reflects
    // only the result of this attempt.
    this.lastError = '';
    this.broadcastStatus();

    try {
      await this.pushPending();
      await this.pullAll();
      await this.updateState();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.currentStatus = 'error';
      await this.updateState();
      this.broadcastStatus();
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

      const operation = await SyncOperation.findById(conflict.operationId);
      if (operation) {
        if (resolution === 'local') {
          // Keep the local change and retry pushing it.
          operation.status = 'pending';
          operation.errorMessage = undefined;
          await operation.save();
        } else if (resolution === 'remote' || resolution === 'merged') {
          // Apply the chosen remote/merged version locally.
          operation.status = 'resolved';
          await operation.save();
          const chosenDoc = resolution === 'merged' && mergedDoc ? mergedDoc : conflict.remoteDoc;
          await this.applyLocalDoc(conflict.collection, chosenDoc);
        }
      }

      await this.updateState();
      this.broadcastStatus();
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

    for (const op of pending) {
      try {
        op.status = 'syncing';
        await op.save();
        await this.pushOperation(op);
        op.status = 'resolved';
        op.errorMessage = undefined;
        await op.save();
      } catch (error) {
        op.retryCount += 1;
        op.status = op.retryCount >= 3 ? 'failed' : 'pending';
        op.errorMessage = error instanceof Error ? error.message : String(error);
        this.lastError = `[sync] push failed for ${op.method} ${op.path} (${op.collection}): ${op.errorMessage}`;
        await op.save();
        // Stop pushing on conflict or repeated failure to keep order.
        if (op.status === 'failed' || op.errorMessage?.includes('CONFLICT')) {
          break;
        }
      }
    }

    this.lastPushAt = new Date();
    this.currentStatus = 'idle';
    await this.updateState();
    this.broadcastStatus();
  }

  private async pushOperation(op: any): Promise<void> {
    const envelope: RequestEnvelope = {
      kind: 'request',
      requestId: crypto.randomUUID(),
      method: op.method,
      path: op.path,
      headers: op.headers || {},
      body: op.body,
    };

    const response = await this.request(this.targetHostId, envelope);

    if (response.kind === 'error') {
      throw new Error(response.message || 'PUSH_FAILED');
    }

    if (response.kind !== 'response') {
      throw new Error('UNEXPECTED_ENVELOPE');
    }

    const body = this.parseBody(response.body);

    if (response.status === 409 && body?.conflict) {
      await this.recordConflict(op, body.remoteDoc);
      throw new Error('CONFLICT');
    }

    if (response.status >= 400) {
      throw new Error(body?.message || `HTTP_${response.status}`);
    }
  }

  private async recordConflict(operation: any, remoteDoc: any): Promise<void> {
    let localDoc: any = {};
    const Model = this.getLocalModel(operation.collection);
    if (Model && operation.documentId) {
      localDoc = (await Model.findById(operation.documentId).lean()) || {};
    }

    await SyncConflict.create({
      collection: operation.collection,
      documentId: operation.documentId,
      operationId: operation._id,
      localDoc,
      remoteDoc,
      status: 'pending',
    });

    operation.conflictId = (await SyncConflict.findOne({ operationId: operation._id }))?._id;
    await operation.save();
  }

  private async pullAll(): Promise<void> {
    if (!this.online || !this.relay || !this.targetHostId) return;
    this.currentStatus = 'pulling';
    this.broadcastStatus();

    const state = await this.ensureState();
    const since = state.lastPullAt;

    for (const collection of SYNC_COLLECTIONS) {
      try {
        await this.pullCollection(collection, since);
      } catch (error) {
        const message = `[sync] pull failed for ${collection.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(message);
        this.lastError = message;
      }
    }

    this.lastPullAt = new Date();
    this.currentStatus = 'idle';
    await this.updateState();
    this.broadcastStatus();
  }

  private async pullCollection(collection: SyncCollectionConfig, since?: Date): Promise<void> {
    const Model = this.getLocalModel(collection.model);
    if (!Model) {
      console.warn(`[sync] local model ${collection.model} not found`);
      return;
    }

    const pageSize = 200;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const query: Record<string, string> = { limit: String(pageSize), page: String(page) };
      if (since) query.since = since.toISOString();
      if (collection.syncAuthFields) query.includeAuth = 'true';

      const queryString = new URLSearchParams(query).toString();
      const envelope: RequestEnvelope = {
        kind: 'request',
        requestId: crypto.randomUUID(),
        method: 'GET',
        path: `/api/v1/sync/pull/${collection.name}?${queryString}`,
        headers: {},
      };

      const response = await this.request(this.targetHostId, envelope);
      if (response.kind !== 'response') {
        throw new Error('UNEXPECTED_ENVELOPE');
      }
      const body = this.parseBody(response.body);
      if (response.status >= 400) {
        throw new Error(body?.message || `HTTP_${response.status}`);
      }
      const docs = body?.docs || [];
      hasMore = body?.hasMore ?? false;
      page += 1;

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
    }
  }

  private async applyLocalDoc(collectionName: string, doc: any): Promise<void> {
    const cfg = SYNC_COLLECTIONS.find((c) => c.name === collectionName);
    if (!cfg) return;
    const Model = this.getLocalModel(cfg.model);
    if (!Model) return;

    const id = doc._id || doc.id;
    if (!id) return;

    const cleanDoc = { ...doc };
    delete cleanDoc.__v;

    try {
      await Model.findByIdAndUpdate(id, cleanDoc, { upsert: true, new: true, setDefaultsOnInsert: true });
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
      console.log('[sync] skipping pulled doc, local copy has pending changes', cfg.name, dupKey);
      return true;
    }

    const remoteUpdatedAt = new Date(remoteDoc.updatedAt || 0).getTime();
    const localUpdatedAt = new Date(localDoc.updatedAt || 0).getTime();

    if (remoteUpdatedAt > localUpdatedAt) {
      // Remote is newer: remove the local duplicate and insert the remote version.
      await Model.findByIdAndDelete(localId);
      await Model.create(remoteDoc);
      console.log('[sync] resolved duplicate key by keeping remote', cfg.name, dupKey);
      return true;
    }

    // Local is newer or equal: keep local. If the remote _id differs, the host
    // will receive the local version on the next push and update its copy.
    console.log('[sync] resolved duplicate key by keeping local', cfg.name, dupKey);
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
      // The driver prints unquoted keys: { type: "DELIVERY", orderId: "505" }
      return JSON.parse(match[1].replace(/([a-zA-Z0-9_]+):/g, '"$1":'));
    } catch {
      return null;
    }
  }

  private async request(targetHostId: string, envelope: RequestEnvelope): Promise<RelayEnvelope> {
    if (!this.relay) throw new Error('RELAY_NOT_AVAILABLE');
    await this.waitForRegistered(10000);
    return this.relay.request(targetHostId, envelope, REQUEST_TIMEOUT_MS);
  }

  private async waitForRegistered(timeoutMs: number): Promise<void> {
    if (!this.relay) throw new Error('RELAY_NOT_AVAILABLE');
    const start = Date.now();
    while (this.relay.getState() !== 'registered') {
      if (Date.now() - start > timeoutMs) {
        throw new Error('NOT_REGISTERED');
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
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
    // Atomic upsert avoids duplicate-key races when several sync operations
    // run concurrently at startup.
    return SyncState.findOneAndUpdate(
      { _id: 'global' },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
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

export default SyncEngine;
