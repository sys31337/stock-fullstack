import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from './helpers/common';
import { productsSchema } from './products';

const billsSchema = new Schema({
  billDate: requiredString,
  orderId: requiredNumber,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  type: {
    type: String,
    enum: ['BUY', 'SALE', 'ORDER'],
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  products: [productsSchema],
  orderTotalHT: requiredNumber,
  orderTotalTTC: requiredNumber,
  orderPaid: requiredNumber,
  orderDebts: requiredNumber,
  paymentMethod: {
    type: String,
    default: 'Cash',
    required: true,
  },
  pricingCategory: {
    type: Number,
    default: 0,
  },
  description: String,
}, { timestamps: true });

const Bill = model('Bill', billsSchema);
export default Bill;
