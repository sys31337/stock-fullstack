import express, { NextFunction, Request, Response } from 'express';
import { auth } from '@api/middlewares/auth';
import { getAllBills, createOne, updateOne, getBillsOfType, getSingleBill, } from '@api/controllers/bills';
import { createBillValidator } from '@api/validations/bills';

const router = express.Router();

const billBeautifier = (req: Request, _res: Response, next: NextFunction) => {
  const { category, customer, ...rest } = req.body;
  req.body = {
    ...rest,
    ...(category.length === 24 && { category }),
    ...(customer.length === 24 && { customer }),
  }
  next();
}

router.route('/')
  .get(auth, getAllBills)
  .post(auth, billBeautifier, createBillValidator, createOne);

router.route('/:type')
  .get(auth, getBillsOfType);

router.route('/info/:id')
  .get(auth, getSingleBill)
  .put(auth, createBillValidator, updateOne);

export default router;
