import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from '@api/models/helpers/common';
import { productsSchema } from '@api/models/products';

const billsSchema = new Schema({
  billDate: requiredString,
  orderId: { type: String, required: true },
  manualOrderId: { type: Boolean, default: false },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
  salesPerson: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  type: {
    type: String,
    enum: ['BUY', 'SALE', 'ORDER', 'DELIVERY'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'cancelled', 'completed'],
    default: 'completed',
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
  paymentMethod: { type: String, default: '' },
  pricingCategory: { type: Number, default: 0 },
  description: String,
  content: { type: String, default: '' },
  contentHistory: [{
    content: { type: String, default: '' },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  }],
}, { timestamps: true });

billsSchema.index({ type: 1, orderId: 1 });

const Bill = model('Bill', billsSchema);
export default Bill;
