import Product from '../models/products';
import { IProduct } from '../types/IProducts';

export const buyBillProductHandler = (products: IProduct[]) => {
  products.forEach(async ({ quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer, productName, barCode, ...rest }) => {
    const query = { productName, barCode },
      update = { $inc: { quantity }, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer, ...rest },
      options = { upsert: true, new: true, setDefaultsOnInsert: true };
      console.log({ quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer, productName, barCode, ...rest })
    await Product.findOneAndUpdate(query, update, options);
  })
}