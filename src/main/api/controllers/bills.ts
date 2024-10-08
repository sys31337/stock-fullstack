import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import { IUserIdRequest } from '@api/types/common';
import { buyBillProductHandler, buyBillproductUpdateHandler } from '@api/functions/products';
import { getLatestBill } from '@api/functions/bills';
import { IProduct } from '@api/types/IProducts';

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

    const oldBill = await Bill.findById(id).lean();

    if (!oldBill) {
      return res.status(404).send({ message: 'Bill not found' });
    }

    const { products: oldProducts } = oldBill || { products: [] };
    const { products: newProducts, category, customer } = body;

    if (!newProducts || newProducts.length === 0) {
      return res.status(400).send({ message: 'Products array is missing or empty' });
    }

    const oldProductsArr = oldProducts.map((product: IProduct) => ({ ...product, category, customer }));
    const newProductsArr = newProducts.map((product: IProduct) => ({ ...product, category, customer }));

    await buyBillproductUpdateHandler(oldProductsArr, newProductsArr);

    const updateBill = await Bill.findByIdAndUpdate(id, payload, { new: true });
    return res.status(200).send(updateBill);
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

const getAllBills = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
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
