import { Request, Response, NextFunction } from 'express';
import Bill from '../models/bills';
import { IUserIdRequest } from '../types/common';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const payload = {
      ...body,
      createBy: userId,
    }
    const createBill = await Bill.create(payload);
    return res.status(200).send(createBill);
  } catch (error) {
    return next(error);
  }
}

const updateOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const payload = {
      ...body,
      updatedBy: userId,
    }
    const updateBill = await Bill.create(payload);
    return res.status(200).send(updateBill);
  } catch (error) {
    return next(error);
  }
}

const getLatestBillOfType = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const latestBillOfType = await Bill.findOne({ type }, {}, { sort: { 'createdAt': -1 } });
    return res.status(200).send(latestBillOfType.orderId);
  } catch (error) {
    return next(error);
  }
}

const getAllBills = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const bills = await Bill.find();
    return res.status(200).send(bills);
  } catch (error) {
    return next(error);
  }
}

export {
  createOne,
  updateOne,
  getLatestBillOfType,
  getAllBills,
}
