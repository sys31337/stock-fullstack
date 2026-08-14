import { model, Schema, Types } from 'mongoose';

export type SyncOperationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type SyncOperationStatus = 'pending' | 'syncing' | 'failed' | 'resolved';

export interface ISyncOperation {
  /** Client-generated globally unique id for this operation. */
  operationId: string;
  method: SyncOperationMethod;
  collection: string;
  path: string;
  documentId?: string;
  body?: any;
  headers?: Record<string, string>;
  status: SyncOperationStatus;
  retryCount: number;
  errorMessage?: string;
  conflictId?: Types.ObjectId;
  /** Server sequence number known when the operation was recorded. */
  baseSequence?: number;
  /** Server updatedAt of the document known when the operation was recorded. */
  baseUpdatedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const syncOperationSchema = new Schema<ISyncOperation>({
  operationId: { type: String, required: true, unique: true, index: true },
  method: { type: String, enum: ['POST', 'PUT', 'PATCH', 'DELETE'], required: true },
  collection: { type: String, required: true },
  path: { type: String, required: true },
  documentId: { type: String, index: true },
  body: { type: Schema.Types.Mixed },
  headers: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'syncing', 'failed', 'resolved'], default: 'pending', index: true },
  retryCount: { type: Number, default: 0 },
  errorMessage: { type: String },
  conflictId: { type: Schema.Types.ObjectId, ref: 'SyncConflict' },
  baseSequence: { type: Number },
  baseUpdatedAt: { type: String },
}, { timestamps: true });

syncOperationSchema.index({ status: 1, collection: 1, documentId: 1 });
syncOperationSchema.index({ operationId: 1, status: 1 });

const SyncOperation = model<ISyncOperation>('SyncOperation', syncOperationSchema);
export default SyncOperation;
