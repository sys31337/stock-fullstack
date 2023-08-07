import express from 'express';

import usersRouter from './helpers/users';
import customersRouter from './helpers/customers';
import categoriesRouter from './helpers/categories';
import billsRouter from './helpers/bills';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/customers', customersRouter);
router.use('/categories', categoriesRouter);
router.use('/bills', billsRouter);

export default router;
