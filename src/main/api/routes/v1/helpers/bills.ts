import express, { NextFunction, Request, Response } from 'express';
import { auth } from '@api/middlewares/auth';
import { getAllBills, createOne, updateOne, getBillsOfType, getSingleBill, checkOrderId, updateContent, } from '@api/controllers/bills';
import { cancelOrder, completeOrder } from '@api/controllers/orders';
import { createBillValidator, updateBillValidator } from '@api/validations/bills';

const router = express.Router();

const billBeautifier = (req: Request, _res: Response, next: NextFunction) => {
  const { category, customer, ...rest } = req.body;
  req.body = {
    ...rest,
    ...(typeof category === 'string' && category.length === 24 && { category }),
    ...(typeof customer === 'string' && customer.length === 24 && { customer }),
  }
  next();
}

router.route('/')
  .get(auth, getAllBills)
  .post(auth, billBeautifier, createBillValidator, createOne);

router.route('/:type')
  .get(auth, getBillsOfType);

router.get('/:type/check-id/:orderId', auth, checkOrderId);

router.route('/info/:id')
  .get(auth, getSingleBill)
  .put(auth, updateBillValidator, updateOne);

router.route('/info/:id/content')
  .put(auth, updateContent);

router.route('/order/:id/cancel')
  .put(auth, cancelOrder);

router.route('/order/:id/complete')
  .put(auth, completeOrder);

export default router;
