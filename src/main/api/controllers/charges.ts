import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Charge from '@api/models/charges';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const getAll = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { type, startDate, endDate, warehouse } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    if (warehouse) filter.warehouse = warehouse;
    if (!req.isMainAccount && req.assignedWarehouses?.length) {
      filter.warehouse = { $in: req.assignedWarehouses };
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const charges = await Charge.find(filter)
      .populate('warehouse', 'name')
      .populate('createdBy', 'fullname username')
      .sort('-date')
      .lean();

    return res.status(200).send(charges);
  } catch (error) {
    return next(error);
  }
};

const getSummary = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, warehouse } = req.query;
    const match: any = {};

    if (warehouse) match.warehouse = new mongoose.Types.ObjectId(warehouse as string);
    if (!req.isMainAccount && req.assignedWarehouses?.length) {
      match.warehouse = { $in: req.assignedWarehouses.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        match.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    const [totalAgg, byTypeAgg] = await Promise.all([
      Charge.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Charge.aggregate([
        { $match: match },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    return res.status(200).send({
      total: totalAgg[0]?.total || 0,
      byType: byTypeAgg,
    });
  } catch (error) {
    return next(error);
  }
};

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const charge = await Charge.create({
      ...body,
      createdBy: userId,
    });

    await createAuditLog(req, {
      action: 'create',
      resource: 'charge',
      resourceId: charge._id.toString(),
      details: `Created ${charge.type} charge of ${charge.amount}`,
    });

    return res.status(201).send(charge);
  } catch (error) {
    return next(error);
  }
};

const updateOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid charge id' });
    }

    const charge = await Charge.findByIdAndUpdate(id, req.body, { new: true });
    if (!charge) return res.status(404).send({ message: 'Charge not found' });

    await createAuditLog(req, {
      action: 'edit',
      resource: 'charge',
      resourceId: id,
      details: `Updated ${charge.type} charge of ${charge.amount}`,
    });

    return res.status(200).send(charge);
  } catch (error) {
    return next(error);
  }
};

const deleteOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid charge id' });
    }

    const charge = await Charge.findByIdAndDelete(id);
    if (!charge) return res.status(404).send({ message: 'Charge not found' });

    await createAuditLog(req, {
      action: 'delete',
      resource: 'charge',
      resourceId: id,
      details: `Deleted ${charge.type} charge of ${charge.amount}`,
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getSummary, createOne, updateOne, deleteOne };
