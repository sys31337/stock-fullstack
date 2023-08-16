import { Request, Response, NextFunction } from 'express';
import Bill from '../models/bills';
import { IUserIdRequest } from '../types/common';
import { buyBillProductHandler } from '../functions/products';
import { getLatestBill } from '../functions/bills';
import { IProduct } from '../types/IProducts';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const { type, products } = body;
    const { category, customer } = body;
    const payload = {
      ...body,
      orderId: parseInt(await getLatestBill(type), 10) + 1,
      createBy: userId,
    }

    if (type === 'BUY') buyBillProductHandler(products.map((product: IProduct) => ({ ...product, category, customer })));

    const createBill = await new Bill(payload).save();
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
    return res.status(200).send(await getLatestBill(type));
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

const getSingleBill = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id).populate('customer');
    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
}

export {
  createOne,
  updateOne,
  getLatestBillOfType,
  getAllBills,
  getSingleBill,
}
