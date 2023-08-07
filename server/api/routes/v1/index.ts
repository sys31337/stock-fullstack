import express from 'express';

import usersRouter from './helpers/users';
import customersRouter from './helpers/customers';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/customers', customersRouter);

export default router;
