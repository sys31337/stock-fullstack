import mongoose from 'mongoose';
import { recordChange } from '@api/services/syncChangeLogService';
import type { SyncChangeOperation } from '@api/models/syncChangeLog';
import { SYNC_COLLECTIONS } from '../../sync/collectionConfig';

let hostChangeTrackingEnabled = false;

export function setHostChangeTracking(enabled: boolean): void {
  hostChangeTrackingEnabled = enabled;
}

export function isHostChangeTrackingEnabled(): boolean {
  return hostChangeTrackingEnabled;
}

export interface CapturedChange {
  collection: string;
  documentId: string;
  operation: SyncChangeOperation;
  docSnapshot?: any;
}

/**
 * Marks the current async context as a sync replay so the host-side change
 * tracker does not write to the change log directly. Instead it captures
 * side-effects so they can be logged with the originating client's metadata.
 *
 * pushOperations replays one operation at a time, so a simple global array is
 * sufficient. AsyncLocalStorage cannot be used here because the replayed
 * request crosses the local HTTP boundary to the Express server.
 */
let syncReplayDepth = 0;
let capturedChanges: CapturedChange[] = [];

export function isInsideSyncReplay(): boolean {
  return syncReplayDepth > 0;
}

export async function withSyncReplay<T>(fn: () => Promise<T>): Promise<{ result: T; captures: CapturedChange[] }> {
  const isOuterReplay = syncReplayDepth === 0;
  syncReplayDepth += 1;
  if (isOuterReplay) {
    capturedChanges = [];
  }

  try {
    const result = await fn();
    return { result, captures: isOuterReplay ? capturedChanges : [] };
  } catch (error) {
    if (isOuterReplay) {
      capturedChanges = [];
    }
    throw error;
  } finally {
    syncReplayDepth -= 1;
    if (isOuterReplay) {
      capturedChanges = [];
    }
  }
}

function normalizeSnapshot(doc: any): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  return obj;
}

function recordOrCaptureChange(change: CapturedChange): void {
  if (!hostChangeTrackingEnabled) return;
  if (isInsideSyncReplay()) {
    capturedChanges.push(change);
    return;
  }
  recordChange({ ...change, isHostOrigin: true }).catch(() => {});
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

    // isNew is reset to false before post('save') runs, so capture it in pre('save').
    Model.schema.pre('save', function preSave(this: mongoose.Document) {
      (this as any).__sync_wasNew = this.isNew;
    });

    Model.schema.post('save', function recordSave(this: mongoose.Document) {
      if ((this as any).$isSubdocument) return;
      const docId = this._id?.toString();
      if (!docId) return;
      const wasNew = (this as any).__sync_wasNew ?? false;
      recordOrCaptureChange({
        collection: cfg.name,
        documentId: docId,
        operation: wasNew ? 'create' : 'update',
        docSnapshot: normalizeSnapshot(this),
      });
    });

    Model.schema.post('findOneAndUpdate', async function recordUpdate(doc: any) {
      if (!doc) return;
      const docId = doc._id?.toString();
      if (!docId) return;
      recordOrCaptureChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'update',
        docSnapshot: normalizeSnapshot(doc),
      });
    });

    Model.schema.post('findOneAndDelete', async function recordDelete(doc: any) {
      if (!doc) return;
      const docId = doc._id?.toString();
      if (!docId) return;
      recordOrCaptureChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'delete',
      });
    });

    // updateOne (query middleware) — controllers sometimes use updateOne or
    // findByIdAndUpdate aliases that resolve to updateOne underneath.
    Model.schema.pre('updateOne', async function preUpdateOne() {
      try {
        const filter = this.getFilter();
        const doc = await Model.findOne(filter).select('_id').lean();
        if (doc) {
          (this as any).__sync_docId = String((doc as any)._id);
        }
      } catch { /* ignore pre-hook errors */ }
    });

    Model.schema.post('updateOne', async function postUpdateOne() {
      const docId = (this as any).__sync_docId as string | undefined;
      if (!docId) return;
      const current = await Model.findById(docId).lean();
      if (!current) {
        recordOrCaptureChange({
          collection: cfg.name,
          documentId: docId,
          operation: 'delete',
        });
      } else {
        recordOrCaptureChange({
          collection: cfg.name,
          documentId: docId,
          operation: 'update',
          docSnapshot: normalizeSnapshot(current),
        });
      }
    });

    // updateMany (query middleware)
    Model.schema.pre('updateMany', async function preUpdateMany() {
      try {
        const filter = this.getFilter();
        const docs = await Model.find(filter).select('_id').lean();
        (this as any).__sync_docIds = docs.map((d: any) => String(d._id));
      } catch { /* ignore pre-hook errors */ }
    });

    Model.schema.post('updateMany', async function postUpdateMany() {
      const docIds = ((this as any).__sync_docIds as string[] | undefined) || [];
      for (const docId of docIds) {
        const current = await Model.findById(docId).lean();
        if (!current) {
          recordOrCaptureChange({
            collection: cfg.name,
            documentId: docId,
            operation: 'delete',
          });
        } else {
          recordOrCaptureChange({
            collection: cfg.name,
            documentId: docId,
            operation: 'update',
            docSnapshot: normalizeSnapshot(current),
          });
        }
      }
    });

    // deleteOne as a document method (e.g. doc.deleteOne())
    Model.schema.post('deleteOne', { document: true, query: false }, async function postDocDeleteOne(this: mongoose.Document) {
      const docId = this._id?.toString();
      if (!docId) return;
      recordOrCaptureChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'delete',
      });
    });

    // deleteOne as a query (e.g. Model.deleteOne({ ... }))
    Model.schema.pre('deleteOne', async function preDeleteOne() {
      try {
        const filter = this.getFilter();
        const doc = await Model.findOne(filter).select('_id').lean();
        if (doc) {
          (this as any).__sync_docId = String((doc as any)._id);
        }
      } catch { /* ignore pre-hook errors */ }
    });

    Model.schema.post('deleteOne', async function postQueryDeleteOne() {
      const docId = (this as any).__sync_docId as string | undefined;
      if (!docId) return;
      recordOrCaptureChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'delete',
      });
    });

    // deleteMany (query middleware)
    Model.schema.pre('deleteMany', async function preDeleteMany() {
      try {
        const filter = this.getFilter();
        const docs = await Model.find(filter).select('_id').lean();
        (this as any).__sync_docIds = docs.map((d: any) => String(d._id));
      } catch { /* ignore pre-hook errors */ }
    });

    Model.schema.post('deleteMany', async function postDeleteMany() {
      const docIds = ((this as any).__sync_docIds as string[] | undefined) || [];
      for (const docId of docIds) {
        recordOrCaptureChange({
          collection: cfg.name,
          documentId: docId,
          operation: 'delete',
        });
      }
    });
  }
}
