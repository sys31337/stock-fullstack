import express from 'express';
import {
  getAllCustomers, getAllClients, getAllSuppliers, createNewCustomer,
} from '../../../controllers/customers';
import { auth } from '../../../middlewares/auth';
import { createCustomerValidator } from '../../../validations/customers';

const router = express.Router();

router.route('/')
  .get(auth, getAllCustomers)
  .post(auth, createCustomerValidator, createNewCustomer);

router.get('/clients', auth, getAllClients);

router.get('/suppliers', auth, getAllSuppliers);

export default router;
