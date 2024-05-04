import express from 'express';
import {
  createOne,
  updateOne,
  getAllProducts,
} from '../../../controllers/products';
import { auth } from '../../../middlewares/auth';
import { updateProductValidator } from '../../../validations/products';

const router = express.Router();

router.route('/')
  .get(auth, getAllProducts)
  .post(auth, createOne);

router.route('/:id')
  .put(auth, updateProductValidator, updateOne);

export default router;
