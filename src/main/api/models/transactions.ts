import { model, Schema } from 'mongoose';
import { requiredString } from './helpers/common';

const transactionsSchema = new Schema({
  orderDate: requiredString,
  client: {
    type: Schema.Types.ObjectId,
    refPath: 'clientModel',
  },
  clientModel: {
    type: String,
    required: true,
    enum: ['Supplier', 'Client']
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
  orderId: {
    type: Schema.Types.ObjectId,
    refPath: 'orderModel',
  },
  orderModel: {
    type: Schema.Types.ObjectId,
    required: true,
    enum: ['Payment', 'Receipt', 'Sale']
  },
  transactionDate: Date,
  type: {
    ...requiredString,
    enum: ['SALE', 'RECEIPT', 'FUND'],
  },
}, { timestamps: true });

const Transaction = model('Transaction', transactionsSchema);
export default Transaction;
