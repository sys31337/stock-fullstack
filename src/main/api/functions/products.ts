import Product from '@api/models/products';
import { IProduct } from '@api/types/IProducts';
import compareProductsArrays from '@api/utils/productsArray';

interface AdjustOptions {
  seed?: boolean;
}

async function adjustWarehouseStock(
  barCode: string,
  warehouseId: string | undefined,
  deltaQty: number,
  deltaReserved: number,
  options: AdjustOptions = {},
): Promise<any> {
  const product = await Product.findOne({ barCode });
  if (!product) {
    throw new Error(`Product with barcode ${barCode} not found`);
  }

  if (!warehouseId) {
    product.quantity = Number(product.quantity || 0) + deltaQty;
    product.reserved = Math.max(Number(product.reserved || 0) + deltaReserved, 0);
    if (product.quantity < 0) product.quantity = 0;
    await product.save();
    return product;
  }

  let entry = product.warehouseStock?.find((s: any) => String(s.warehouse) === String(warehouseId));
  if (!entry) {
    if (!options.seed) {
      throw new Error(`Product ${product.productName} has no stock in the selected warehouse`);
    }
    product.warehouseStock?.push({ warehouse: warehouseId as any, quantity: 0, stack: 0, reserved: 0 });
    entry = product.warehouseStock![product.warehouseStock!.length - 1];
  }

  entry.quantity = Math.max(Number(entry.quantity || 0) + deltaQty, 0);
  entry.reserved = Math.max(Number(entry.reserved || 0) + deltaReserved, 0);
  product.quantity = (product.warehouseStock || []).reduce((sum, s) => sum + Number(s.quantity || 0), 0);
  product.reserved = (product.warehouseStock || []).reduce((sum, s) => sum + Number(s.reserved || 0), 0);
  await product.save();
  return product;
}

export const updateProduct = async (product: IProduct, warehouseId?: any) => {
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

  const incQty = Number(quantity);
  const setFields = {
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
  };

  if (!warehouseId) {
    await Product.findOneAndUpdate(
      { barCode },
      { $set: setFields, $inc: { quantity: incQty } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return;
  }

  const incResult = await Product.updateOne(
    { barCode, 'warehouseStock.warehouse': warehouseId },
    { $inc: { quantity: incQty, 'warehouseStock.$.quantity': incQty } },
  );

  if (incResult.matchedCount === 0) {
    await Product.updateOne(
      { barCode },
      {
        $set: setFields,
        $inc: { quantity: incQty },
        $push: { warehouseStock: { warehouse: warehouseId, quantity: Math.max(incQty, 0), stack: Number(stack) || 0, reserved: 0 } },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
};

export const reduceProductQuantity = async (product: IProduct, warehouseId?: any) => {
  const {
    quantity,
    productName,
    barCode
  } = product;

  const qty = Number(quantity);
  console.log(`Reducing quantity: ${quantity} for product: ${productName}`);

  if (qty <= 0) {
    await Product.deleteOne({ barCode });
    return;
  }

  if (!warehouseId) {
    const updated = await Product.findOneAndUpdate({ barCode }, { $inc: { quantity: -qty } }, { new: true });
    if (updated && Number(updated.quantity) <= 0) {
      await Product.deleteOne({ barCode });
    }
    return;
  }

  const decResult = await Product.updateOne(
    { barCode, 'warehouseStock.warehouse': warehouseId, 'warehouseStock.quantity': { $gte: qty } },
    { $inc: { quantity: -qty, 'warehouseStock.$.quantity': -qty } },
  );

  if (decResult.matchedCount === 0) {
    const productDoc = await Product.findOne({ barCode });
    const entry = productDoc?.warehouseStock?.find((s: any) => String(s.warehouse) === String(warehouseId));
    const actual = entry ? Math.min(Number(entry.quantity), qty) : 0;
    if (entry && actual > 0) {
      entry.quantity -= actual;
      await (productDoc as any).save();
      await Product.updateOne({ barCode }, { $inc: { quantity: -actual } });
    }
  }

  const after = await Product.findOne({ barCode });
  if (after && Number(after.quantity) <= 0) {
    await Product.deleteOne({ barCode });
  }
};

export const buyBillProductHandler = async (products: IProduct[], warehouseId?: any) => {
  for (const product of products) {
    await updateProduct(product, warehouseId);
  }
};

export const buyBillproductUpdateHandler = async (oldProducts: IProduct[], newProducts: IProduct[], warehouseId?: any) => {
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
    await updateProduct(product, warehouseId);
  }

  for (const product of deleted) {
    await reduceProductQuantity(product, warehouseId);
  }

  await buyBillProductHandler(added, warehouseId);
};

export const orderReserveProducts = async (products: IProduct[], skipStockCheck = false, warehouseId?: any) => {
  for (const product of products) {
    const { barCode, quantity } = product;
    const existingProduct = await Product.findOne({ barCode });

    if (!existingProduct) {
      throw new Error(`Product with barcode ${barCode} not found`);
    }

    if (!skipStockCheck) {
      let available: number;
      if (warehouseId) {
        const entry = existingProduct.warehouseStock?.find(
          (s: any) => String(s.warehouse) === String(warehouseId),
        );
        available = entry ? Number(entry.quantity) - Number(entry.reserved || 0) : 0;
      } else {
        available = Number(existingProduct.quantity) - Number(existingProduct.reserved || 0);
      }
      if (available < Number(quantity)) {
        throw new Error(`Insufficient stock for product ${existingProduct.productName}. Available: ${available}, requested: ${quantity}`);
      }
    }

    await adjustWarehouseStock(barCode, warehouseId, -Number(quantity), Number(quantity), { seed: true });
  }
};

export const orderReleaseProducts = async (products: IProduct[], warehouseId?: any) => {
  for (const product of products) {
    const { barCode, quantity } = product;
    await adjustWarehouseStock(barCode, warehouseId, Number(quantity), -Number(quantity));
  }
};

export const deliveryDecrementProducts = async (products: IProduct[], skipStockCheck = false, warehouseId?: any) => {
  for (const product of products) {
    const { barCode, quantity } = product;
    const existing = await Product.findOne({ barCode });

    if (!existing) {
      throw new Error(`Product with barcode ${barCode} not found`);
    }

    if (!skipStockCheck) {
      let currentQty: number;
      if (warehouseId) {
        const entry = existing.warehouseStock?.find(
          (s: any) => String(s.warehouse) === String(warehouseId),
        );
        currentQty = entry ? Number(entry.quantity) : 0;
      } else {
        currentQty = Number(existing.quantity);
      }
      if (currentQty < Number(quantity)) {
        throw new Error(`Insufficient stock for product ${existing.productName}. Available: ${currentQty}, requested: ${quantity}`);
      }
    }

    await adjustWarehouseStock(barCode, warehouseId, -Number(quantity), 0);
  }
};

export const deliveryProductUpdateHandler = async (oldProducts: IProduct[], newProducts: IProduct[], skipStockCheck = false, warehouseId?: any) => {
  // First revert old delivery: add back all old product quantities
  for (const product of oldProducts) {
    const { barCode, quantity } = product;
    await adjustWarehouseStock(barCode, warehouseId, Number(quantity), 0);
  }

  // Then apply new delivery: check stock and deduct new product quantities
  for (const product of newProducts) {
    const { barCode, quantity } = product;
    const existing = await Product.findOne({ barCode });
    if (!existing) {
      throw new Error(`Product with barcode ${barCode} not found`);
    }
    if (!skipStockCheck) {
      let currentQty: number;
      if (warehouseId) {
        const entry = existing.warehouseStock?.find(
          (s: any) => String(s.warehouse) === String(warehouseId),
        );
        currentQty = entry ? Number(entry.quantity) : 0;
      } else {
        currentQty = Number(existing.quantity);
      }
      if (currentQty < Number(quantity)) {
        throw new Error(`Insufficient stock for product ${existing.productName}. Available: ${currentQty}, requested: ${quantity}`);
      }
    }
    await adjustWarehouseStock(barCode, warehouseId, -Number(quantity), 0);
  }
};

export const orderCompleteProducts = async (products: IProduct[], warehouseId?: any) => {
  for (const product of products) {
    const { barCode, quantity } = product;
    await adjustWarehouseStock(barCode, warehouseId, 0, -Number(quantity));
  }
};
