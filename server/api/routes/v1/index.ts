import express from 'express';

import usersRouter from './helpers/users';
import customersRouter from './helpers/customers';
import categoriesRouter from './helpers/categories';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/customers', customersRouter);
router.use('/categories', categoriesRouter);

export default router;
