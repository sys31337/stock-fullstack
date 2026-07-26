import { Response, NextFunction } from 'express';
import StockMovement from '@api/models/stockMovement';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const getAll = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1', limit = '50', product, warehouse, type, startDate, endDate,
    } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('product', 'productName barCode')
        .populate('warehouse', 'name code')
        .populate('createdBy', 'fullname username')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      StockMovement.countDocuments(filter),
    ]);

    return res.status(200).send({ movements, total, page: pageNum, limit: limitNum });
  } catch (error) {
    return next(error);
  }
};

const getByProduct = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const movements = await StockMovement.find({ product: productId })
      .populate('warehouse', 'name code')
      .populate('createdBy', 'fullname username')
      .sort('-createdAt');
    return res.status(200).send(movements);
  } catch (error) {
    return next(error);
  }
};

const getByWarehouse = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { warehouseId } = req.params;
    const movements = await StockMovement.find({ warehouse: warehouseId })
      .populate('product', 'productName barCode')
      .populate('createdBy', 'fullname username')
      .sort('-createdAt');
    return res.status(200).send(movements);
  } catch (error) {
    return next(error);
  }
};

const createAdjustment = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { product, warehouse, quantity, notes } = req.body;
    const movement = await new StockMovement({
      product,
      warehouse,
      type: 'ADJUSTMENT',
      quantity,
      notes,
      createdBy: req.userId,
    }).save();

    await createAuditLog(req, {
      action: 'create',
      resource: 'stock_movement',
      resourceId: movement._id.toString(),
      details: `Stock adjustment: ${quantity} units for product ${product}`,
    });

    return res.status(201).send(movement);
  } catch (error) {
    return next(error);
  }
};

export { getAll, getByProduct, getByWarehouse, createAdjustment };
