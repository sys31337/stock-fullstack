import { Request, Response, NextFunction } from 'express';
import Product from '../models/products';

const createOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product } = req.body;
    const insertProduct = await Product.create(product);
    return res.status(200).send(insertProduct);
  } catch (error) {
    return next(error);
  }
}

const createMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { products } = req.body;
    const insertProducts = await Product.create(products);
    return res.status(200).send(insertProducts);
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

export {
  createOne,
  createMultiple,
  updateOne,
}
