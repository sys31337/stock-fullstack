import { Request, Response, NextFunction } from 'express';
import Product from '@api/models/products';

const createOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product } = req.body;
    const insertProduct = await Product.create(product);
    return res.status(200).send(insertProduct);
  } catch (error) {
    return next(error);
  }
}

const updateOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params: { id }, body: payload } = req;
    const updatedProduct = await Product.findByIdAndUpdate(id, payload, { new: true });
    return res.status(200).send(updatedProduct);
  } catch (error) {
    return next(error);
  }
}

const deleteOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;
    await Product.findByIdAndDelete(id);
    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
}

const getAllProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedProduct = await Product.find();
    return res.status(200).send(updatedProduct);
  } catch (error) {
    return next(error);
  }
}

export {
  createOne,
  updateOne,
  deleteOne,
  getAllProducts,
}
