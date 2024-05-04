import { model, Schema } from 'mongoose';
import { requiredString } from './helpers/common';

const categoriesSchema = new Schema({
  name: requiredString,
  description: String,
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
}, { timestamps: true });

const Category = model('Category', categoriesSchema);
export default Category;
