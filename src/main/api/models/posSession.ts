import { model, Schema } from 'mongoose';
import { IPosSession } from '@api/types/IPosSession';

const posSessionSchema = new Schema<IPosSession>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
  openingDate: { type: Date, required: true, default: Date.now },
  closingDate: Date,
  openingCash: { type: Number, required: true, default: 0 },
  expectedCash: { type: Number, default: 0 },
  actualCash: Number,
  cashDifference: Number,
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

posSessionSchema.index({ status: 1, user: 1 });

const PosSession = model<IPosSession>('PosSession', posSessionSchema);
export default PosSession;
