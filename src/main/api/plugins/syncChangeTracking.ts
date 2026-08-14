import mongoose from 'mongoose';
import { recordChange } from '@api/services/syncChangeLogService';
import { SYNC_COLLECTIONS } from '../../sync/collectionConfig';

let hostChangeTrackingEnabled = false;

export function setHostChangeTracking(enabled: boolean): void {
  hostChangeTrackingEnabled = enabled;
}

export function isHostChangeTrackingEnabled(): boolean {
  return hostChangeTrackingEnabled;
}

/**
 * Marks the current async context as a sync replay so the host-side change
 * tracker does not create duplicate change log entries for changes that were
 * already produced by a client.
 */
let syncReplayDepth = 0;

export function withSyncReplay<T>(fn: () => Promise<T>): Promise<T> {
  syncReplayDepth += 1;
  return fn().finally(() => {
    syncReplayDepth -= 1;
  });
}

export function isInsideSyncReplay(): boolean {
  return syncReplayDepth > 0;
}

function normalizeSnapshot(doc: any): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  return obj;
}

/**
 * Attaches post-save and post-remove hooks to every synced Mongoose model so
 * host-local mutations are recorded in the change log and broadcast to peers.
 * This should be called once the database connection is established and only
 * when running in host mode.
 */
export function registerHostChangeTracking(): void {
  for (const cfg of SYNC_COLLECTIONS) {
    const Model = mongoose.connection.models[cfg.model];
    if (!Model) continue;

    Model.schema.post('save', function recordSave(this: mongoose.Document) {
      if (!hostChangeTrackingEnabled || isInsideSyncReplay()) return;
      const docId = this._id?.toString();
      if (!docId) return;
      const isNew = this.isNew;
      recordChange({
        collection: cfg.name,
        documentId: docId,
        operation: isNew ? 'create' : 'update',
        docSnapshot: normalizeSnapshot(this),
        isHostOrigin: true,
      }).catch(() => {});
    });

    Model.schema.post('findOneAndUpdate', async function recordUpdate(doc: any) {
      if (!hostChangeTrackingEnabled || isInsideSyncReplay()) return;
      if (!doc) return;
      const docId = doc._id?.toString();
      if (!docId) return;
      await recordChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'update',
        docSnapshot: normalizeSnapshot(doc),
        isHostOrigin: true,
      }).catch(() => {});
    });

    Model.schema.post('findOneAndDelete', async function recordDelete(doc: any) {
      if (!hostChangeTrackingEnabled || isInsideSyncReplay()) return;
      if (!doc) return;
      const docId = doc._id?.toString();
      if (!docId) return;
      await recordChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'delete',
        isHostOrigin: true,
      }).catch(() => {});
    });
  }
}
