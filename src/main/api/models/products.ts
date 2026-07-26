import { model, Schema } from 'mongoose';
import { IProduct } from '@api/types/IProducts';
import { requiredNumber, requiredString } from './helpers/common';

const warehouseStockSchema = new Schema({
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, default: 0 },
  stack: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
}, { _id: false });

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
  tva: { ...requiredNumber, default: 19 },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
  notify: { type: Boolean, default: true },
  warehouseStock: [warehouseStockSchema],
}, { timestamps: true });

const Product = model<IProduct>('Product', productsSchema);
export default Product;
