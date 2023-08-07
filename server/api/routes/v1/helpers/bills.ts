import express from 'express';
import { auth } from '../../../middlewares/auth';
import { createCategoryValidator } from '../../../validations/categories';
import { getAllBills, createOne, updateOne, getLatestBillOfType, } from '../../../controllers/bills';
import { createBillValidator } from '../../../validations/bills';

const router = express.Router();

router.route('/')
  .get(auth, getAllBills)
  .post(auth, createBillValidator, createOne);

router.route('/:type')
  .get(auth, getLatestBillOfType);

export default router;
