import express from 'express';
import {
  createOne,
  updateOne,
  deleteOne,
  getAllProducts,
} from '@api/controllers/products';
import { auth } from '@api/middlewares/auth';
import { filterByWarehouse } from '@api/middlewares/warehouseAccess';
import { updateProductValidator } from '@api/validations/products';

const router = express.Router();

router.route('/')
  .get(auth, filterByWarehouse(), getAllProducts)
  .post(auth, createOne);

router.route('/:id')
  .put(auth, updateProductValidator, updateOne)
  .delete(auth, deleteOne);

export default router;
