import express from 'express';
import {
  getAllCustomers, getAllClients, getAllSuppliers, createNewCustomer,
} from '@api/controllers/customers';
import { auth } from '@api/middlewares/auth';
import { createCustomerValidator } from '@api/validations/customers';

const router = express.Router();

router.route('/')
  .get(auth, getAllCustomers)
  .post(auth, createCustomerValidator, createNewCustomer);

router.get('/clients', auth, getAllClients);

router.get('/suppliers', auth, getAllSuppliers);

export default router;
