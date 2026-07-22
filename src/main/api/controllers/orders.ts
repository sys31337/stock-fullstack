import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import { IUserIdRequest } from '@api/types/common';
import { orderReleaseProducts, orderCompleteProducts } from '@api/functions/products';

const cancelOrder = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).send({ message: 'Order not found' });
    }

    if (bill.type !== 'ORDER') {
      return res.status(400).send({ message: 'Bill is not an order' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).send({ message: `Order is already ${bill.status}` });
    }

    await orderReleaseProducts(bill.products);

    bill.status = 'cancelled';
    await bill.save();

    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
};

const completeOrder = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).send({ message: 'Order not found' });
    }

    if (bill.type !== 'ORDER') {
      return res.status(400).send({ message: 'Bill is not an order' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).send({ message: `Order is already ${bill.status}` });
    }

    await orderCompleteProducts(bill.products);

    bill.status = 'completed';
    await bill.save();

    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
};

export {
  cancelOrder,
  completeOrder,
};