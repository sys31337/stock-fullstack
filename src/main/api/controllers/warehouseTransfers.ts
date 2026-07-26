import { Response, NextFunction } from 'express';
import WarehouseTransfer from '@api/models/warehouseTransfer';
import StockMovement from '@api/models/stockMovement';
import Product from '@api/models/products';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const generateTransferNumber = async (): Promise<string> => {
  const count = await WarehouseTransfer.countDocuments();
  const year = new Date().getFullYear();
  return `TRF-${year}-${(count + 1).toString().padStart(6, '0')}`;
};

const getAll = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', status, fromWarehouse, toWarehouse } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status) filter.status = status;
    if (fromWarehouse) filter.fromWarehouse = fromWarehouse;
    if (toWarehouse) filter.toWarehouse = toWarehouse;

    const [transfers, total] = await Promise.all([
      WarehouseTransfer.find(filter)
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('products.product', 'productName barCode')
        .populate('createdBy', 'fullname username')
        .populate('approvedBy', 'fullname username')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      WarehouseTransfer.countDocuments(filter),
    ]);

    return res.status(200).send({ transfers, total, page: pageNum, limit: limitNum });
  } catch (error) {
    return next(error);
  }
};

const getById = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const transfer = await WarehouseTransfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('products.product', 'productName barCode sellPrice_1')
      .populate('createdBy', 'fullname username')
      .populate('approvedBy', 'fullname username');
    if (!transfer) return res.status(404).send({ message: 'Transfer not found' });
    return res.status(200).send(transfer);
  } catch (error) {
    return next(error);
  }
};

const create = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { fromWarehouse, toWarehouse, products, notes } = req.body;

    if (fromWarehouse === toWarehouse) {
      return res.status(400).send({ message: 'Source and destination warehouses must be different' });
    }

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).send({ message: `Product ${item.product} not found` });
      }
      const whStock = product.warehouseStock?.find(
        (s) => s.warehouse.toString() === fromWarehouse,
      );
      const available = whStock ? whStock.quantity - (whStock.reserved || 0) : 0;
      if (available < item.quantity) {
        return res.status(400).send({
          message: `Insufficient stock for ${product.productName}. Available: ${available}, requested: ${item.quantity}`,
        });
      }
    }

    const transferNumber = await generateTransferNumber();
    const transfer = await new WarehouseTransfer({
      transferNumber,
      fromWarehouse,
      toWarehouse,
      products,
      notes,
      createdBy: req.userId,
    }).save();

    await createAuditLog(req, {
      action: 'create',
      resource: 'warehouse_transfer',
      resourceId: transfer._id.toString(),
      details: `Created transfer ${transferNumber} from ${fromWarehouse} to ${toWarehouse}`,
    });

    return res.status(201).send(transfer);
  } catch (error) {
    return next(error);
  }
};

const approve = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const transfer = await WarehouseTransfer.findById(req.params.id);
    if (!transfer) return res.status(404).send({ message: 'Transfer not found' });
    if (transfer.status !== 'pending') {
      return res.status(400).send({ message: `Transfer is already ${transfer.status}` });
    }

    for (const item of transfer.products) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      const fromStock = product.warehouseStock?.find(
        (s) => s.warehouse.toString() === transfer.fromWarehouse.toString(),
      );
      if (!fromStock || fromStock.quantity < item.quantity) {
        return res.status(400).send({
          message: `Insufficient stock for product ${product.productName}`,
        });
      }
      fromStock.quantity -= item.quantity;

      let toStock = product.warehouseStock?.find(
        (s) => s.warehouse.toString() === transfer.toWarehouse.toString(),
      );
      if (toStock) {
        toStock.quantity += item.quantity;
      } else {
        product.warehouseStock?.push({
          warehouse: transfer.toWarehouse,
          quantity: item.quantity,
          stack: 0,
          reserved: 0,
        });
      }

      product.quantity = (product.warehouseStock || []).reduce((sum, s) => sum + s.quantity, 0);
      await product.save();

      await StockMovement.create({
        product: product._id,
        warehouse: transfer.fromWarehouse,
        type: 'TRANSFER_OUT',
        quantity: -item.quantity,
        reference: transfer.transferNumber,
        relatedTransfer: transfer._id,
        createdBy: req.userId,
      });

      await StockMovement.create({
        product: product._id,
        warehouse: transfer.toWarehouse,
        type: 'TRANSFER_IN',
        quantity: item.quantity,
        reference: transfer.transferNumber,
        relatedTransfer: transfer._id,
        createdBy: req.userId,
      });
    }

    transfer.status = 'completed';
    (transfer as any).approvedBy = req.userId;
    transfer.completedAt = new Date();
    await transfer.save();

    await createAuditLog(req, {
      action: 'approve',
      resource: 'warehouse_transfer',
      resourceId: transfer._id.toString(),
      details: `Approved transfer ${transfer.transferNumber}`,
    });

    return res.status(200).send(transfer);
  } catch (error) {
    return next(error);
  }
};

const cancel = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const transfer = await WarehouseTransfer.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason },
      { new: true },
    );
    if (!transfer) return res.status(404).send({ message: 'Transfer not found' });
    if (transfer.status !== 'pending') {
      return res.status(400).send({ message: `Transfer is already ${transfer.status}` });
    }

    await createAuditLog(req, {
      action: 'cancel',
      resource: 'warehouse_transfer',
      resourceId: transfer._id.toString(),
      details: `Cancelled transfer ${transfer.transferNumber}: ${reason}`,
    });

    return res.status(200).send(transfer);
  } catch (error) {
    return next(error);
  }
};

export { getAll, getById, create, approve, cancel };
