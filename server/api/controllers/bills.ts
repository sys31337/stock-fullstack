import { Request, Response, NextFunction } from 'express';
import Bill from '../models/bills';
import { IUserIdRequest } from '../types/common';
import { buyBillProductHandler } from '../functions/products';
import { getLatestBill } from '../functions/bills';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const { type, products } = body;
    const payload = {
      ...body,
      orderId: parseInt(await getLatestBill(type), 10) + 1,
      createBy: userId,
    }
    if (type === 'BUY') buyBillProductHandler(products);

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
    return res.status(200).send(getLatestBill(type));
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
