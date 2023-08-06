import { model, Schema } from 'mongoose';
import { requiredNumber, requiredString } from './helpers/common';

export const productsSchema = new Schema({
  id: requiredString,
  barCode: requiredString,
  productName: requiredString,
  quantity: requiredNumber,
  stack: requiredNumber,
  buyPrice: requiredNumber,
  reserved: Number,
  sellPrice_1: requiredNumber,
  sellPrice_2: requiredNumber,
  sellPrice_3: requiredNumber,
  totalHT: requiredNumber,
  totalTTC: requiredNumber,
  tva: {
    ...requiredNumber,
    default: 19,
  },
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
  notify: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Product = model('Product', productsSchema);
export default Product;
