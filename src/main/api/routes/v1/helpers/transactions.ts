import express from 'express';
import {
  createFund,
  getAll,
  getByCustomer,
} from '@api/controllers/transactions';
import { auth } from '@api/middlewares/auth';
import { createTransactionValidator } from '@api/validations/transactions';

const router = express.Router();

router.route('/')
  .get(auth, getAll)
  .post(auth, createTransactionValidator, createFund);

router.get('/customer/:id', auth, getByCustomer);

export default router;
