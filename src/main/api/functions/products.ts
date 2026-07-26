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

  const query = { barCode },
    update = {
      $inc: { quantity },
      $set: {
        id,
        productName,
        stack,
        buyPrice,
        sellPrice_1,
        sellPrice_2,
        sellPrice_3,
        tva,
        category,
        customer
      }
    },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

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

  const query = { barCode },
    update = {
      $inc: { quantity: -quantity },
      $set: {
        id,
        productName,
        stack,
        buyPrice,
        sellPrice_1,
        sellPrice_2,
        sellPrice_3,
        tva,
        category,
        customer
      }
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

export const orderReserveProducts = async (products: IProduct[]) => {
  for (const product of products) {
    const { barCode, quantity } = product;
    const existingProduct = await Product.findOne({ barCode });

    if (!existingProduct) {
      throw new Error(`Product with barcode ${barCode} not found`);
    }

    const available = Number(existingProduct.quantity) - Number(existingProduct.reserved || 0);
    if (available < Number(quantity)) {
      throw new Error(`Insufficient stock for product ${existingProduct.productName}. Available: ${available}, requested: ${quantity}`);
    }

    await Product.findOneAndUpdate(
      { barCode },
      {
        $inc: {
          quantity: -Number(quantity),
          reserved: +Number(quantity),
        },
      },
      { new: true }
    );
  }
};

export const orderReleaseProducts = async (products: IProduct[]) => {
  for (const product of products) {
    const { barCode, quantity } = product;

    await Product.findOneAndUpdate(
      { barCode },
      {
        $inc: {
          quantity: +Number(quantity),
          reserved: -Number(quantity),
        },
      },
      { new: true }
    );
  }
};

export const deliveryDecrementProducts = async (products: IProduct[]) => {
  for (const product of products) {
    const { barCode, quantity } = product;
    const existing = await Product.findOne({ barCode });

    if (!existing) {
      throw new Error(`Product with barcode ${barCode} not found`);
    }

    const currentQty = Number(existing.quantity);
    if (currentQty < Number(quantity)) {
      throw new Error(`Insufficient stock for product ${existing.productName}. Available: ${currentQty}, requested: ${quantity}`);
    }

    await Product.findOneAndUpdate(
      { barCode },
      { $inc: { quantity: -Number(quantity) } },
      { new: true }
    );
  }
};

export const deliveryProductUpdateHandler = async (oldProducts: IProduct[], newProducts: IProduct[]) => {
  // First revert old delivery: add back all old product quantities
  for (const product of oldProducts) {
    const { barCode, quantity } = product;
    await Product.findOneAndUpdate(
      { barCode },
      { $inc: { quantity: +Number(quantity) } },
      { new: true }
    );
  }

  // Then apply new delivery: check stock and deduct new product quantities
  for (const product of newProducts) {
    const { barCode, quantity } = product;
    const existing = await Product.findOne({ barCode });
    if (!existing) {
      throw new Error(`Product with barcode ${barCode} not found`);
    }
    const currentQty = Number(existing.quantity);
    if (currentQty < Number(quantity)) {
      throw new Error(`Insufficient stock for product ${existing.productName}. Available: ${currentQty}, requested: ${quantity}`);
    }
    await Product.findOneAndUpdate(
      { barCode },
      { $inc: { quantity: -Number(quantity) } },
      { new: true }
    );
  }
};

export const orderCompleteProducts = async (products: IProduct[]) => {
  for (const product of products) {
    const { barCode, quantity } = product;

    await Product.findOneAndUpdate(
      { barCode },
      {
        $inc: {
          reserved: -Number(quantity),
        },
      },
      { new: true }
    );
  }
};
