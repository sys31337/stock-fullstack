import express from 'express';
import {
  getAllCustomers, getAllClients, getAllSuppliers, createNewCustomer, updateOne, deleteOne,
} from '@api/controllers/customers';
import { auth } from '@api/middlewares/auth';
import { createCustomerValidator, updateCustomerValidator } from '@api/validations/customers';

const router = express.Router();

router.route('/')
  .get(auth, getAllCustomers)
  .post(auth, createCustomerValidator, createNewCustomer);

router.route('/:id')
  .put(auth, updateCustomerValidator, updateOne)
  .delete(auth, deleteOne);

router.get('/clients', auth, getAllClients);

router.get('/suppliers', auth, getAllSuppliers);

export default router;
