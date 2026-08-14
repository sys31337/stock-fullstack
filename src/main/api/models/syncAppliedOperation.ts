import { model, Schema } from 'mongoose';

export interface ISyncAppliedOperation {
  operationId: string;
  collection: string;
  documentId: string;
  method: string;
  /** HTTP status returned to the originating peer. */
  statusCode: number;
  /** Normalized body returned to the originating peer. */
  responseBody?: any;
  /** Sequence number assigned if a change log entry was produced. */
  sequence?: number;
  appliedAt: Date;
}

const syncAppliedOperationSchema = new Schema<ISyncAppliedOperation>({
  operationId: { type: String, required: true, unique: true, index: true },
  collection: { type: String, required: true, index: true },
  documentId: { type: String, required: true, index: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseBody: { type: Schema.Types.Mixed },
  sequence: { type: Number, index: true },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: false });

syncAppliedOperationSchema.index({ collection: 1, documentId: 1, appliedAt: -1 });

const SyncAppliedOperation = model<ISyncAppliedOperation>('SyncAppliedOperation', syncAppliedOperationSchema);
export default SyncAppliedOperation;
