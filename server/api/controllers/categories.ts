import { Request, Response, NextFunction } from 'express';
import Category from '../models/categories';

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find();
    return res.status(200).send(categories);
  } catch (error) {
    return next(error);
  }
}

const createNewCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const newCategory = await new Category(payload).save();
    return res.status(200).send(newCategory);
  } catch (error) {
    return next(error);
  }
}

export {
  getAllCategories,
  createNewCategory,
}
