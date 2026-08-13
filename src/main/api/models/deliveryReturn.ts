import { model, Schema } from 'mongoose';

/**
 * End-of-day cash reconciliation for a delivery person.
 *
 * `expectedAmount` is the total cash the delivery person collected that day
 * (sum of `orderPaid` on their DELIVERY bills), `enteredAmount` is the amount
 * typed by the cashier and `returnedAmount` is what was actually handed over.
 */
const deliveryReturnSchema = new Schema({
  deliveryPerson: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    index: true,
  },
  deliveryDate: {
    type: Date,
    required: true,
    index: true,
  },
  expectedAmount: {
    type: Number,
    default: 0,
  },
  enteredAmount: {
    type: Number,
    default: 0,
  },
  returnedAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed'],
    default: 'pending',
  },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

deliveryReturnSchema.index({ deliveryPerson: 1, deliveryDate: -1 });

const DeliveryReturn = model('DeliveryReturn', deliveryReturnSchema);
export default DeliveryReturn;
