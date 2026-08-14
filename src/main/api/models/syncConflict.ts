import { model, Schema } from 'mongoose';

export type SyncConflictStatus = 'pending' | 'local' | 'remote' | 'merged';

export interface ISyncConflict {
  collection: string;
  documentId: string;
  /** Reference to the originating SyncOperation document. */
  operationId?: Schema.Types.ObjectId;
  /** Client-generated operation id (uuid) for v2 operations. */
  operationUuid?: string;
  localDoc: any;
  remoteDoc: any;
  mergedDoc?: any;
  status: SyncConflictStatus;
  createdAt: Date;
  updatedAt: Date;
}

const syncConflictSchema = new Schema<ISyncConflict>({
  collection: { type: String, required: true, index: true },
  documentId: { type: String, required: true, index: true },
  operationId: { type: Schema.Types.ObjectId, ref: 'SyncOperation' },
  operationUuid: { type: String, index: true },
  localDoc: { type: Schema.Types.Mixed, required: true },
  remoteDoc: { type: Schema.Types.Mixed, required: true },
  mergedDoc: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'local', 'remote', 'merged'], default: 'pending', index: true },
}, { timestamps: true });

syncConflictSchema.index({ status: 1, collection: 1 });

const SyncConflict = model<ISyncConflict>('SyncConflict', syncConflictSchema);
export default SyncConflict;
