import { model, Schema } from 'mongoose';
import { ICharge } from '@api/types/ICharge';

const chargesSchema = new Schema<ICharge>({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['salary', 'rent', 'utility', 'tax', 'marketing', 'maintenance', 'other'],
    required: true,
    index: true,
  },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'check', 'other'],
    default: 'cash',
  },
  receiptRef: { type: String, default: '' },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

chargesSchema.index({ date: -1 });

const Charge = model<ICharge>('Charge', chargesSchema);
export default Charge;
