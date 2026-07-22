import { Request, Response, NextFunction } from 'express';
import Customer from '@api/models/customers';

const getAllCustomers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await Customer.find();
    return res.status(200).send(customers);
  } catch (error) {
    return next(error);
  }
}
const getAllClients = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await Customer.find({ type: 'Client' });
    return res.status(200).send(customers);
  } catch (error) {
    return next(error);
  }
}
const getAllSuppliers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await Customer.find({ type: 'Supplier' });
    return res.status(200).send(customers);
  } catch (error) {
    return next(error);
  }
}

const createNewCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const newCustomer = await new Customer(payload).save();
    return res.status(200).send(newCustomer);
  } catch (error) {
    return next(error);
  }
}

const updateOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params: { id }, body: payload } = req;
    const updatedCustomer = await Customer.findByIdAndUpdate(id, payload, { new: true });
    return res.status(200).send(updatedCustomer);
  } catch (error) {
    return next(error);
  }
}

const deleteOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;
    await Customer.findByIdAndDelete(id);
    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
}

export {
  getAllCustomers,
  getAllClients,
  getAllSuppliers,
  createNewCustomer,
  updateOne,
  deleteOne,
}
