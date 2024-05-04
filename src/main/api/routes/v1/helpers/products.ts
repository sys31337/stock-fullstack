import express from 'express';
import {
  createOne,
  updateOne,
  getAllProducts,
} from '@api/controllers/products';
import { auth } from '@api/middlewares/auth';
import { updateProductValidator } from '@api/validations/products';

const router = express.Router();

router.route('/')
  .get(auth, getAllProducts)
  .post(auth, createOne);

router.route('/:id')
  .put(auth, updateProductValidator, updateOne);

export default router;
