import { Request, Response, NextFunction } from 'express';
import Category from '@api/models/categories';

const DEFAULT_ID = '0a0aaa0a0aa00000aaaaaa0a';

const getAllCategories = async (_req: Request, res: Response, next: NextFunction) => {
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

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params: { id }, body: payload } = req;
    if (id === DEFAULT_ID) {
      return res.status(403).send({ message: 'Cannot edit the default category' });
    }
    const updatedCategory = await Category.findByIdAndUpdate(id, payload, { new: true });
    if (!updatedCategory) return res.status(404).send({ message: 'Category not found' });
    return res.status(200).send(updatedCategory);
  } catch (error) {
    return next(error);
  }
}

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;
    if (id === DEFAULT_ID) {
      return res.status(403).send({ message: 'Cannot delete the default category' });
    }
    await Category.findByIdAndDelete(id);
    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
}

export {
  getAllCategories,
  createNewCategory,
  updateCategory,
  deleteCategory,
}
