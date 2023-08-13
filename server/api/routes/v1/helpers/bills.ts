import express, { NextFunction, Request, Response } from 'express';
import { auth } from '../../../middlewares/auth';
import { getAllBills, createOne, updateOne, getLatestBillOfType, getSingleBill, } from '../../../controllers/bills';
import { createBillValidator } from '../../../validations/bills';

const router = express.Router();

const billBeautifier = (req: Request, res: Response, next: NextFunction) => {
  const { category, customer, ...rest } = req.body;
  req.body = {
    ...rest,
    ...(category !== '0' && category),
    ...(customer !== '0' && customer),
  }
  next();
}

router.route('/')
  .get(auth, getAllBills)
  .post(auth, billBeautifier, createBillValidator, createOne);

router.route('/:type')
  .get(auth, getLatestBillOfType);

router.route('/info/:id')
  .get(auth, getSingleBill)
  .put(auth, createBillValidator, updateOne);

export default router;
