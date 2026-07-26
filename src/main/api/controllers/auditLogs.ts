import { Response, NextFunction } from 'express';
import AuditLog from '@api/models/auditLog';
import { IUserIdRequest } from '@api/types/common';

const getAll = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1', limit = '50', action, resource, userId, startDate, endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'fullname username profilePicture')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).send({ logs, total, page: pageNum, limit: limitNum });
  } catch (error) {
    return next(error);
  }
};

const getResources = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const resources = await AuditLog.distinct('resource');
    return res.status(200).send(resources);
  } catch (error) {
    return next(error);
  }
};

const getActions = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const actions = await AuditLog.distinct('action');
    return res.status(200).send(actions);
  } catch (error) {
    return next(error);
  }
};

export { getAll, getResources, getActions };
