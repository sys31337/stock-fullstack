import mongoose from 'mongoose';
import SyncChangeLog, { SyncChangeOperation } from '@api/models/syncChangeLog';
import SyncState from '@api/models/syncState';
import { SYNC_COLLECTIONS } from '../../sync/collectionConfig';
import syncBroadcaster from '../../sync/syncBroadcaster';

/**
 * Atomic sequence counter stored in SyncState.
 * The counter key is `syncSequence` on the global state document.
 */
const SEQUENCE_KEY = 'syncSequence';
const STATE_ID = 'global';

async function nextSequence(): Promise<number> {
  const state = await SyncState.findByIdAndUpdate(
    STATE_ID,
    { $inc: { [SEQUENCE_KEY]: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return state?.[SEQUENCE_KEY] as number;
}

export interface RecordChangeOptions {
  collection: string;
  documentId: string;
  operation: SyncChangeOperation;
  operationId?: string;
  sourceClientId?: string;
  docSnapshot?: any;
  isHostOrigin?: boolean;
}

/**
 * Records a change in the global change log and returns its assigned sequence
 * number. Sequence allocation is atomic, so every persisted mutation gets a
 * unique, monotonically increasing cursor.
 */
export async function recordChange(options: RecordChangeOptions): Promise<number> {
  const sequence = await nextSequence();
  await SyncChangeLog.create({
    sequence,
    collection: options.collection,
    documentId: options.documentId,
    operation: options.operation,
    operationId: options.operationId,
    sourceClientId: options.sourceClientId,
    docSnapshot: options.docSnapshot,
    isHostOrigin: options.isHostOrigin ?? false,
    createdAt: new Date(),
  });
  // Broadcast host-originated changes to linked clients. Client-originated
  // changes are broadcast by the sync push handler so the source peer can be
  // excluded from the broadcast.
  if (options.isHostOrigin) {
    syncBroadcaster.emitChange(sequence).catch(() => {});
  }
  return sequence;
}

export interface PullChangesOptions {
  collection: string;
  cursor: number;
  limit: number;
}

export interface PulledChange {
  sequence: number;
  documentId: string;
  operation: SyncChangeOperation;
  doc?: any;
}

/**
 * Pulls changes for a collection that have a sequence number greater than the
 * supplied cursor. Returns the changes plus the current maximum sequence.
 */
export async function pullChanges(options: PullChangesOptions): Promise<{
  changes: PulledChange[];
  hasMore: boolean;
  maxSequence: number;
  nextCursor: number;
}> {
  const { collection, cursor, limit } = options;
  const pageSize = Math.min(Math.max(1, limit), 500);

  const docs = await SyncChangeLog.find({ collection, sequence: { $gt: cursor } })
    .sort({ sequence: 1 })
    .limit(pageSize + 1)
    .lean();

  const hasMore = docs.length > pageSize;
  if (hasMore) docs.pop();

  const maxSequenceResult = await SyncChangeLog.findOne({ collection })
    .sort({ sequence: -1 })
    .select('sequence')
    .lean();
  const maxSequence = maxSequenceResult?.sequence ?? 0;

  const changes: PulledChange[] = docs.map((entry) => ({
    sequence: entry.sequence,
    documentId: entry.documentId,
    operation: entry.operation,
    doc: entry.operation === 'delete'
      ? { _id: entry.documentId, __deleted: true }
      : entry.docSnapshot,
  }));

  return {
    changes,
    hasMore,
    maxSequence,
    nextCursor: hasMore ? docs[docs.length - 1]?.sequence ?? cursor : maxSequence,
  };
}

/**
 * Returns the current global maximum sequence number across all collections.
 */
export async function getGlobalMaxSequence(): Promise<number> {
  const state = await SyncState.findById(STATE_ID).lean();
  return (state?.[SEQUENCE_KEY] as number) ?? 0;
}

/**
 * Looks up the most recent change log entry for a document.
 */
export async function getLatestChangeForDocument(
  collection: string,
  documentId: string,
): Promise<{ sequence: number; operation: SyncChangeOperation; operationId?: string } | null> {
  const entry = await SyncChangeLog.findOne({ collection, documentId })
    .sort({ sequence: -1 })
    .lean();
  if (!entry) return null;
  return {
    sequence: entry.sequence,
    operation: entry.operation,
    operationId: entry.operationId,
  };
}

function normalizeSnapshot(doc: any): any {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.__v;
  return obj;
}

/**
 * One-time seed of the change log from existing host data. This lets fresh
 * clients perform a cursor-based initial sync instead of relying on timestamps.
 * The operation is idempotent: it only runs when the change log is empty.
 */
export async function seedChangeLogFromExistingData(): Promise<number> {
  const existing = await SyncChangeLog.estimatedDocumentCount();
  if (existing > 0) return 0;

  let seeded = 0;
  for (const cfg of SYNC_COLLECTIONS) {
    const Model = mongoose.connection.models[cfg.model];
    if (!Model) continue;

    const docs = await Model.find({}).lean();
    for (const doc of docs) {
      const docId = doc._id?.toString();
      if (!docId) continue;
      // Idempotent: only seed if no change log entry exists for this document.
      const alreadySeeded = await SyncChangeLog.exists({ collection: cfg.name, documentId: docId });
      if (alreadySeeded) continue;
      await recordChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'create',
        docSnapshot: normalizeSnapshot(doc),
        isHostOrigin: true,
      });
      seeded += 1;
    }
  }
  return seeded;
}

/**
 * Repairs the change log so it always reflects the current state of every
 * synced collection. This fixes drift caused by operations that bypassed the
 * host change-tracking hooks (direct DB writes, imports, migrations, etc.).
 *
 * - Adds a create entry for every existing document that has no entry.
 * - Adds a delete entry for every document that has entries but no longer exists.
 */
export async function repairChangeLog(): Promise<{ created: number; deleted: number }> {
  let created = 0;
  let deleted = 0;

  for (const cfg of SYNC_COLLECTIONS) {
    const Model = mongoose.connection.models[cfg.model];
    if (!Model) continue;

    const [docs, loggedIds] = await Promise.all([
      Model.find({}, '_id').lean(),
      SyncChangeLog.distinct('documentId', { collection: cfg.name }),
    ]);

    const docIds = new Set(docs.map((d: any) => String(d._id)));
    const loggedIdSet = new Set((loggedIds || []).map(String));

    // Existing documents without any change log entry need a create entry.
    for (const doc of docs) {
      const docId = String(doc._id);
      if (loggedIdSet.has(docId)) continue;
      const fullDoc = await Model.findById(docId).lean();
      if (!fullDoc) continue;
      await recordChange({
        collection: cfg.name,
        documentId: docId,
        operation: 'create',
        docSnapshot: normalizeSnapshot(fullDoc),
        isHostOrigin: true,
      });
      created += 1;
    }

    // Documents that have change log entries but no longer exist need a delete entry.
    for (const loggedId of loggedIdSet) {
      if (docIds.has(loggedId)) continue;
      const latest = await SyncChangeLog.findOne({ collection: cfg.name, documentId: loggedId })
        .sort({ sequence: -1 })
        .lean();
      if (latest?.operation === 'delete') continue;
      await recordChange({
        collection: cfg.name,
        documentId: loggedId,
        operation: 'delete',
        isHostOrigin: true,
      });
      deleted += 1;
    }
  }

  return { created, deleted };
}
