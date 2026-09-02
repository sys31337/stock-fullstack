import { model, Schema } from 'mongoose';

export interface IIdempotencyRecord {
  key: string;
  method: string;
  path: string;
  status: number;
  responseBody?: any;
  createdAt: Date;
}

const idempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    key: { type: String, required: true, unique: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    status: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Auto-expire idempotency records after 7 days so this table stays small.
idempotencyRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

const IdempotencyRecord = model<IIdempotencyRecord>('IdempotencyRecord', idempotencyRecordSchema);
export default IdempotencyRecord;
