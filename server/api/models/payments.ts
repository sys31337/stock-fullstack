import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from './helpers/common';

const paymentsSchema = new Schema({
  paymentDate: {
    type: Date,
    required: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  addedAmount: {
    type: Number,
    required: true,
  },
  oldFunds: {
    type: Number,
    required: true,
  },
  newFunds: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const Payment = model('Payment', paymentsSchema);
export default Payment;
