import express from 'express';
import {
  getAllCategories, createNewCategory,
} from '../../../controllers/categories';
import { auth } from '../../../middlewares/auth';
import { createCategoryValidator } from '../../../validations/categories';

const router = express.Router();

router.route('/')
  .get(auth, getAllCategories)
  .post(auth, createCategoryValidator, createNewCategory);

export default router;
