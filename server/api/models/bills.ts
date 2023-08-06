import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from './helpers/common';
import { productsSchema } from './products';

const billsSchema = new Schema({
  billDate: requiredString,
  orderId: requiredString,
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
  },
  pricingCategory: {
    type: Number,
    default: 0,
  },
  description: String,
}, { timestamps: true });

const Bill = model('Bill', billsSchema);
export default Bill;
