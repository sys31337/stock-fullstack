import { model, Schema } from 'mongoose';

/**
 * Ledger entry for a client / supplier credit movement.
 *
 * `addedAmount` is signed: positive movements (initial credit, virement) increase
 * the customer's `credit`, negative movements (SALE / BUY bills) decrease it.
 */
const transactionsSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['FUND', 'SALE', 'BUY'],
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
  bill: {
    type: Schema.Types.ObjectId,
    ref: 'Bill',
    default: null,
  },
  description: String,
}, { timestamps: true });

const Transaction = model('Transaction', transactionsSchema);
export default Transaction;
