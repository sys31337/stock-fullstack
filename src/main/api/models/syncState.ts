import { model, Schema } from 'mongoose';

export interface ISyncState {
  _id: string;
  lastPullAt?: Date;
  lastPushAt?: Date;
  isPulling: boolean;
  isPushing: boolean;
  lastError?: string;
  pendingCount: number;
  conflictCount: number;
  updatedAt: Date;
}

const syncStateSchema = new Schema<ISyncState>({
  _id: { type: String, default: 'global' },
  lastPullAt: { type: Date },
  lastPushAt: { type: Date },
  isPulling: { type: Boolean, default: false },
  isPushing: { type: Boolean, default: false },
  lastError: { type: String },
  pendingCount: { type: Number, default: 0 },
  conflictCount: { type: Number, default: 0 },
}, { timestamps: true, _id: false });

const SyncState = model<ISyncState>('SyncState', syncStateSchema);
export default SyncState;
