import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import DeliveryReturn from '@api/models/deliveryReturn';
import User from '@api/models/user';
import Bill from '@api/models/bills';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const round2 = (n: number): number => Math.round(n * 100) / 100;

const getWarehouseFilter = (req: IUserIdRequest): any => {
  const { warehouse } = req.query;
  const warehouseFilter: any = {};
  if (warehouse) {
    warehouseFilter.warehouse = warehouse;
  } else if (!req.isMainAccount && req.assignedWarehouses?.length) {
    warehouseFilter.warehouse = { $in: req.assignedWarehouses };
  }
  return warehouseFilter;
};

/** Sum of cash collected by a delivery person on the given day. */
const computeExpectedAmount = async (
  deliveryPerson: string,
  deliveryDate: Date,
  req: IUserIdRequest,
): Promise<number> => {
  const dayStart = new Date(deliveryDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(deliveryDate);
  dayEnd.setHours(23, 59, 59, 999);

  const [agg] = await Bill.aggregate([
    {
      $match: {
        ...getWarehouseFilter(req),
        type: 'DELIVERY',
        status: { $ne: 'cancelled' },
        salesPerson: new mongoose.Types.ObjectId(deliveryPerson),
        createdAt: { $gte: dayStart, $lte: dayEnd },
      },
    },
    { $group: { _id: null, expected: { $sum: '$orderPaid' } } },
  ]);

  return round2(agg?.expected || 0);
};

const getAll = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);
    const skip = (page - 1) * limit;
    const { deliveryPerson, warehouse, status } = req.query;
    const range = {
      start: req.query.startDate ? new Date(String(req.query.startDate)) : undefined,
      end: req.query.endDate ? new Date(String(req.query.endDate)) : undefined,
    };

    const filter: any = {};
    if (deliveryPerson) filter.deliveryPerson = deliveryPerson;
    if (warehouse) filter.warehouse = warehouse;
    if (status) filter.status = status;
    if (range.start && !Number.isNaN(range.start.getTime())) {
      range.start.setHours(0, 0, 0, 0);
      filter.deliveryDate = { $gte: range.start };
    }
    if (range.end && !Number.isNaN(range.end.getTime())) {
      range.end.setHours(23, 59, 59, 999);
      filter.deliveryDate = { ...(filter.deliveryDate || {}), $lte: range.end };
    }

    const [items, total] = await Promise.all([
      DeliveryReturn.find(filter)
        .populate('deliveryPerson', 'fullname username type')
        .populate('warehouse', 'name code')
        .sort('-deliveryDate')
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryReturn.countDocuments(filter),
    ]);

    return res.status(200).send({ items, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

const getById = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid id' });
    }
    const record = await DeliveryReturn.findById(id)
      .populate('deliveryPerson', 'fullname username type')
      .populate('warehouse', 'name code')
      .lean();
    if (!record) return res.status(404).send({ message: 'Delivery return not found' });
    return res.status(200).send(record);
  } catch (error) {
    return next(error);
  }
};

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { deliveryPerson, warehouse, deliveryDate, enteredAmount, returnedAmount, notes, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(deliveryPerson)) {
      return res.status(400).send({ message: 'Invalid delivery person id' });
    }
    const person = await User.findById(deliveryPerson);
    if (!person) return res.status(404).send({ message: 'Delivery person not found' });

    const date = new Date(deliveryDate);
    const expectedAmount = await computeExpectedAmount(String(person._id), date, req);

    const record = await DeliveryReturn.create({
      deliveryPerson: person._id,
      warehouse: warehouse || undefined,
      deliveryDate: date,
      expectedAmount,
      enteredAmount: Number(enteredAmount || 0),
      returnedAmount: Number(returnedAmount || 0),
      status: status || 'pending',
      notes: notes || undefined,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    await createAuditLog(req, {
      action: 'create',
      resource: 'deliveryReturn',
      resourceId: record._id.toString(),
      details: `Created delivery return for ${person.fullname || person.username}`,
    });

    return res.status(200).send(record);
  } catch (error) {
    return next(error);
  }
};

const updateOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid id' });
    }
    const record = await DeliveryReturn.findById(id);
    if (!record) return res.status(404).send({ message: 'Delivery return not found' });

    const { enteredAmount, returnedAmount, notes, status, warehouse } = req.body;

    if (enteredAmount !== undefined) record.enteredAmount = Number(enteredAmount);
    if (returnedAmount !== undefined) record.returnedAmount = Number(returnedAmount);
    if (notes !== undefined) record.notes = notes;
    if (warehouse !== undefined) record.warehouse = warehouse;
    if (status !== undefined) record.status = status;
    record.updatedBy = req.userId as any;

    await record.save();

    await createAuditLog(req, {
      action: 'update',
      resource: 'deliveryReturn',
      resourceId: record._id.toString(),
      details: `Updated delivery return ${record._id}`,
    });

    return res.status(200).send(record);
  } catch (error) {
    return next(error);
  }
};

const deleteOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid id' });
    }
    const record = await DeliveryReturn.findByIdAndDelete(id);
    if (!record) return res.status(404).send({ message: 'Delivery return not found' });

    await createAuditLog(req, {
      action: 'delete',
      resource: 'deliveryReturn',
      resourceId: id,
      details: `Deleted delivery return ${id}`,
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

export {
  getAll,
  getById,
  createOne,
  updateOne,
  deleteOne,
};
