import { Response, NextFunction } from 'express';
import Product from '@api/models/products';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { product } = req.body;
    if (req.defaultWarehouse && product.quantity) {
      product.warehouseStock = [{
        warehouse: req.defaultWarehouse,
        quantity: product.quantity || 0,
        stack: product.stack || 0,
        reserved: 0,
      }];
    }
    const insertProduct = await Product.create(product);

    await createAuditLog(req, {
      action: 'create',
      resource: 'product',
      resourceId: insertProduct._id.toString(),
      details: `Created product: ${insertProduct.productName}`,
    });

    return res.status(200).send(insertProduct);
  } catch (error) {
    return next(error);
  }
};

const updateOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { params: { id }, body: payload } = req;
    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).send({ message: 'Product not found' });
    }

    // Keep aggregate == sum(warehouseStock) when editing the aggregate quantity.
    if (payload.quantity !== undefined && Number(payload.quantity) !== Number(existing.quantity)) {
      const delta = Number(payload.quantity) - Number(existing.quantity);
      let stock = Array.isArray(existing.warehouseStock) ? existing.warehouseStock.map((s) => ({ ...s })) : [];
      if (stock.length === 0 && req.defaultWarehouse) {
        stock = [{ warehouse: req.defaultWarehouse as any, quantity: 0, stack: existing.stack || 0, reserved: 0 }];
      }
      if (stock.length > 0) {
        const target = stock.find((s) => s.warehouse?.toString() === req.defaultWarehouse) || stock[0];
        target.quantity = Math.max(0, Number(target.quantity || 0) + delta);
        payload.warehouseStock = stock;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, payload, { new: true });

    await createAuditLog(req, {
      action: 'edit',
      resource: 'product',
      resourceId: id,
      details: `Updated product: ${updatedProduct?.productName}`,
    });

    return res.status(200).send(updatedProduct);
  } catch (error) {
    return next(error);
  }
};

const deleteOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;
    const product = await Product.findByIdAndDelete(id);

    await createAuditLog(req, {
      action: 'delete',
      resource: 'product',
      resourceId: id,
      details: `Deleted product: ${product?.productName}`,
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

const getAllProducts = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { warehouse } = req.query;
    const filter: any = {};

    if (warehouse) {
      const warehouses = String(warehouse).split(',').filter(Boolean);
      filter['warehouseStock.warehouse'] = warehouses.length > 1 ? { $in: warehouses } : warehouses[0];
    } else if (!req.isMainAccount && req.warehouseAccessMode !== 'all') {
      filter['warehouseStock.warehouse'] = { $in: req.assignedWarehouses || [] };
    }

    const products = await Product.find(filter).populate('category customer');
    return res.status(200).send(products);
  } catch (error) {
    return next(error);
  }
};

export {
  createOne,
  updateOne,
  deleteOne,
  getAllProducts,
};
