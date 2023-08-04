import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from './helpers/common';

const receiptBillsSchema = new Schema({
  orderDate: requiredString,
  orderId: requiredString,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  supplierType: {
    type: String,
    enum: ['CLIENT', 'SUPPLIER'],
    default: 'SUPPLIER'
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
  orderTotalHT: requiredNumber,
  orderTotalTTC: requiredNumber,
  orderPaid: requiredNumber,
  orderDebts: requiredNumber,
}, { timestamps: true });

const ReceiptBill = model('ReceiptBill', receiptBillsSchema);
export default ReceiptBill;
