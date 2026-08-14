import { model, Schema } from 'mongoose';

export type SyncChangeOperation = 'create' | 'update' | 'delete';

export interface ISyncChangeLog {
  sequence: number;
  collection: string;
  documentId: string;
  operation: SyncChangeOperation;
  /** The originating client operation id; guarantees idempotency. */
  operationId?: string;
  /** The relay client id that originated the change, if known. */
  sourceClientId?: string;
  /** Snapshot of the document after the change (omitted for deletes or kept minimal). */
  docSnapshot?: any;
  /** True when this change was produced by the host's own local API. */
  isHostOrigin: boolean;
  createdAt: Date;
}

const syncChangeLogSchema = new Schema<ISyncChangeLog>({
  sequence: { type: Number, required: true, unique: true, index: true },
  collection: { type: String, required: true, index: true },
  documentId: { type: String, required: true, index: true },
  operation: { type: String, enum: ['create', 'update', 'delete'], required: true },
  operationId: { type: String, index: true },
  sourceClientId: { type: String, index: true },
  docSnapshot: { type: Schema.Types.Mixed },
  isHostOrigin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

// Compound index for efficient pull by collection + sequence.
syncChangeLogSchema.index({ collection: 1, sequence: 1 });
// Index for deduplication checks during host-side change recording.
syncChangeLogSchema.index({ collection: 1, documentId: 1, operationId: 1 });

const SyncChangeLog = model<ISyncChangeLog>('SyncChangeLog', syncChangeLogSchema);
export default SyncChangeLog;
