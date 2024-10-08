import Product from '@api/models/products';
import { IProduct } from '@api/types/IProducts';
import compareProductsArrays from '@api/utils/productsArray';

export const updateProduct = async (product: IProduct) => {
  const {
    id,
    quantity,
    stack,
    buyPrice,
    sellPrice_1,
    sellPrice_2,
    sellPrice_3,
    tva,
    category,
    customer,
    productName,
    barCode
  } = product;

  const query = { id, productName, barCode },
    update = {
      $inc: { quantity },
      stack,
      buyPrice,
      sellPrice_1,
      sellPrice_2,
      sellPrice_3,
      tva,
      category,
      customer
    },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

  if (Number(quantity) < 0) {
    console.error(`Error: Quantity for product ${productName} cannot be negative.`);
    return;
  }

  await Product.findOneAndUpdate(query, update, options);
};

export const reduceProductQuantity = async (product: IProduct) => {
  const {
    id,
    quantity,
    stack,
    buyPrice,
    sellPrice_1,
    sellPrice_2,
    sellPrice_3,
    tva,
    category,
    customer,
    productName,
    barCode
  } = product;

  const query = { id, productName, barCode },
    update = {
      $inc: { quantity: -quantity },
      stack,
      buyPrice,
      sellPrice_1,
      sellPrice_2,
      sellPrice_3,
      tva,
      category,
      customer
    },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

  console.log(`Reducing quantity: ${quantity} for product: ${productName}`);

  if (Number(quantity) <= 0) {
    await Product.deleteOne(query);
  } else {
    await Product.findOneAndUpdate(query, update, options);
  }
};

export const buyBillProductHandler = async (products: IProduct[]) => {
  for (const product of products) {
    await updateProduct(product);
  }
};

export const buyBillproductUpdateHandler = async (oldProducts: IProduct[], newProducts: IProduct[]) => {
  const { added, deleted, intersection } = compareProductsArrays(oldProducts, newProducts);

  for (const { id, barCode, productName, tva, buyPrice, quantityDifference: quantity, sellPrice_1, sellPrice_2, sellPrice_3, stack, category, customer } of intersection) {
    const product = {
      id,
      barCode,
      productName,
      tva,
      buyPrice,
      quantity: quantity !== undefined ? quantity : 1,
      sellPrice_1,
      sellPrice_2,
      sellPrice_3,
      stack,
      category,
      customer
    };
    await updateProduct(product);
  }

  for (const product of deleted) {
    await reduceProductQuantity(product);
  }

  await buyBillProductHandler(added);
};
