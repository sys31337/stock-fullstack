import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import PosSession from '@api/models/posSession';
import Bill from '@api/models/bills';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const getOpenSession = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const session = await PosSession.findOne({ user: req.userId, status: 'open' })
      .populate('warehouse', 'name')
      .populate('user', 'fullname username')
      .lean();
    return res.status(200).send({ session });
  } catch (error) {
    return next(error);
  }
};

const getAllSessions = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { user, status } = req.query;
    const filter: any = {};
    if (user) filter.user = user;
    if (status) filter.status = status;

    const sessions = await PosSession.find(filter)
      .populate('warehouse', 'name')
      .populate('user', 'fullname username')
      .sort('-createdAt')
      .lean();
    return res.status(200).send(sessions);
  } catch (error) {
    return next(error);
  }
};

const computeExpectedCash = async (sessionId: string, userId: string, openingCash: number): Promise<number> => {
  const session = await PosSession.findById(sessionId).lean();
  if (!session) return openingCash;

  const from = new Date(session.openingDate);
  const now = new Date();

  const posSales = await Bill.find({
    type: 'POS',
    status: { $ne: 'cancelled' },
    salesPerson: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: from, $lte: now },
  }).lean();

  const cashSales = posSales.reduce((sum, bill) => sum + Number(bill.orderPaid || 0), 0);
  return Number(openingCash) + cashSales;
};

const openSession = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await PosSession.findOne({ user: req.userId, status: 'open' });
    if (existing) {
      return res.status(400).send({ message: 'You already have an open POS session' });
    }

    const session = await PosSession.create({
      ...req.body,
      user: req.userId,
      expectedCash: req.body.openingCash || 0,
    });

    await createAuditLog(req, {
      action: 'create',
      resource: 'posSession',
      resourceId: session._id.toString(),
      details: `Opened POS session with ${session.openingCash}`,
    });

    return res.status(201).send(session);
  } catch (error) {
    return next(error);
  }
};

const closeSession = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { actualCash, notes } = req.body;
    const session = await PosSession.findOne({ user: req.userId, status: 'open' });
    if (!session) {
      return res.status(404).send({ message: 'No open POS session found' });
    }

    const expectedCash = await computeExpectedCash(session._id.toString(), req.userId as string, session.openingCash);
    const difference = Number(actualCash) - expectedCash;

    session.actualCash = Number(actualCash);
    session.expectedCash = expectedCash;
    session.cashDifference = difference;
    session.status = 'closed';
    session.closingDate = new Date();
    session.notes = notes || session.notes;
    await session.save();

    await createAuditLog(req, {
      action: 'edit',
      resource: 'posSession',
      resourceId: session._id.toString(),
      details: `Closed POS session. Expected: ${expectedCash}, Actual: ${actualCash}, Difference: ${difference}`,
    });

    return res.status(200).send(session);
  } catch (error) {
    return next(error);
  }
};

export { getOpenSession, getAllSessions, openSession, closeSession };
