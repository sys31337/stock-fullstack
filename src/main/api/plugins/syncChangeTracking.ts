import mongoose from 'mongoose';
import { AsyncLocalStorage } from 'node:async_hooks';
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
 * Async-local storage for changes captured during a sync replay.
 * Using AsyncLocalStorage keeps captures scoped to the replay's async call
 * stack, so concurrent host-local mutations are never mixed up with a client
 * operation's side effects.
 */
const replayStorage = new AsyncLocalStorage<CapturedChange[]>();

/**
 * Runs `fn` inside a sync-replay context. While inside this context, host-side
 * change-tracking hooks do not write to the change log directly; instead they
 * capture the change so the caller can record all side-effects with the
 * originating client's metadata.
 *
 * Returns both the function result and the captured changes.
 */
export async function withSyncReplay<T>(fn: () => Promise<T>): Promise<{ result: T; captures: CapturedChange[] }> {
  const captures: CapturedChange[] = [];
  const result = await replayStorage.run(captures, fn);
  return { result, captures };
}

function getCurrentCaptures(): CapturedChange[] | undefined {
  return replayStorage.getStore();
}

function normalizeSnapshot(doc: any): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  return obj;
}

function recordOrCaptureChange(change: CapturedChange): void {
  if (!hostChangeTrackingEnabled) return;
  const captures = getCurrentCaptures();
  if (captures) {
    captures.push(change);
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

    Model.schema.post('save', function recordSave(this: mongoose.Document) {
      const docId = this._id?.toString();
      if (!docId) return;
      recordOrCaptureChange({
        collection: cfg.name,
        documentId: docId,
        operation: this.isNew ? 'create' : 'update',
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
