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
    const insertProduct = await Bill.create(payload);
    return res.status(200).send(insertProduct);
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
    const insertProduct = await Bill.create(payload);
    return res.status(200).send(insertProduct);
  } catch (error) {
    return next(error);
  }
}

const getLatestBillOfType = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const latestBillOfType = await Bill.find({ type }).lean();
    console.log(type);
    console.log(latestBillOfType);
    return res.status(200).send(latestBillOfType);
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
