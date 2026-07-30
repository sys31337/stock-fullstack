import express from 'express';
import {
  getAllCategories, createNewCategory, updateCategory, deleteCategory,
} from '@api/controllers/categories';
import { auth } from '@api/middlewares/auth';
import { createCategoryValidator } from '@api/validations/categories';

const router = express.Router();

router.route('/')
  .get(auth, getAllCategories)
  .post(auth, createCategoryValidator, createNewCategory);

router.route('/:id')
  .put(auth, updateCategory)
  .delete(auth, deleteCategory);

export default router;
