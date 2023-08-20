import Product from '../models/products';
import { IProduct } from '../types/IProducts';
import compareProductsArrays from '../utils/productsArray';

export const updateProduct = async (product: IProduct) => {
  const { id, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer, productName, barCode, ...rest } = product;
  const query = { id, productName, barCode },
    update = { $inc: { quantity }, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };
  await Product.findOneAndUpdate(query, update, options);
}

export const buyBillProductHandler = (products: IProduct[]) => products.forEach(async (product) => await updateProduct(product));

export const reduceProductQuantity = async (product: IProduct) => {
  const { id, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer, productName, barCode, ...rest } = product;
  const query = { id, productName, barCode },
    update = { $inc: { quantity: -quantity }, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3, tva, category, customer },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };
  await Product.findOneAndUpdate(query, update, options);
}

export const buyBillproductUpdateHandler = (oldProducts: IProduct[], newProducts: IProduct[]) => {
  const { added, deleted, intersection } = compareProductsArrays(oldProducts, newProducts);
  intersection.forEach(async ({ id, barCode, productName, tva, buyPrice, quantityDifference: quantity, sellPrice_1, sellPrice_2, sellPrice_3, stack, category, customer }) => {
    const product = { id, barCode, productName, tva, buyPrice, quantity, sellPrice_1, sellPrice_2, sellPrice_3, stack, category, customer };
    await updateProduct(product);
  });

  deleted.forEach(async (product) => await reduceProductQuantity(product));
  buyBillProductHandler(added);
}