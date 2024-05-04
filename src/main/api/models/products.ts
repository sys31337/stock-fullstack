import { model, Schema } from 'mongoose';
import { IProduct } from '@api/types/IProducts';
import { requiredNumber, requiredString } from './helpers/common';

export const productsSchema = new Schema<IProduct>({
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
  tva: {
    ...requiredNumber,
    default: 19,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  notify: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const Product = model<IProduct>('Product', productsSchema);
export default Product;
