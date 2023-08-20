import { Request, Response, NextFunction } from 'express';
import Bill from '../models/bills';
import { IUserIdRequest } from '../types/common';
import { buyBillProductHandler } from '../functions/products';
import { getLatestBill } from '../functions/bills';
import { IProduct } from '../types/IProducts';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const { type, products, category, customer } = body;
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
    const { body, userId, params: { id } } = req;
    const payload = {
      ...body,
      updatedBy: userId,
    }
    const oldBill = await Bill.findById(id);
    const { products: oldProducts } = oldBill;
    const { products: newProducts, category, customer } = body;
    console.log(JSON.stringify(oldProducts.map((product: IProduct) => ({ ...product, category, customer }))));
    console.log(JSON.stringify(newProducts.map((product: IProduct) => ({ ...product, category, customer }))));

    return res.status(200).send(oldBill);
  } catch (error) {
    return next(error);
  }
}

const getBillsOfType = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const bills = await Bill.find({ type }).populate('customer category').sort('-createdAt').lean();
    return res.status(200).send(bills);
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
    const bill = await Bill.findById(id).populate('customer category');
    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
}

export {
  createOne,
  updateOne,
  getBillsOfType,
  getAllBills,
  getSingleBill,
}
