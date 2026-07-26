import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from '@api/models/helpers/common';
import { productsSchema } from '@api/models/products';

const billsSchema = new Schema({
  billDate: requiredString,
  orderId: requiredNumber,
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
  type: {
    type: String,
    enum: ['BUY', 'SALE', 'ORDER', 'DELIVERY'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'cancelled', 'completed'],
    default: 'pending',
  },
  reservedUntil: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  cancelReason: String,
  products: [productsSchema],
  orderTotalHT: requiredNumber,
  orderTotalTTC: requiredNumber,
  orderPaid: requiredNumber,
  orderDebts: requiredNumber,
  paymentMethod: { type: String, default: 'Cash', required: true },
  pricingCategory: { type: Number, default: 0 },
  description: String,
}, { timestamps: true });

billsSchema.index({ type: 1, orderId: 1 }, { unique: true });

const Bill = model('Bill', billsSchema);
export default Bill;
