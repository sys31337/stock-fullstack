import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Customer from '@api/models/customers';
import Transaction from '@api/models/transactions';
import { IUserIdRequest } from '@api/types/common';
import { DEFAULT_CUSTOMER_ID } from '@api/functions/transactions';
import { createAuditLog } from '@api/utils/auditLog';

const createFund = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body } = req;
    const { customer: customerId, addedAmount, description } = body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).send({ message: 'Invalid customer id' });
    }
    if (customerId === DEFAULT_CUSTOMER_ID) {
      return res.status(400).send({ message: 'Cannot add credit to the default customer' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).send({ message: 'Customer not found' });
    }

    const oldFunds = Number(customer.credit || 0);
    const newFunds = oldFunds + Number(addedAmount || 0);

    customer.credit = newFunds;
    await customer.save();

    const transaction = await Transaction.create({
      customer: customer._id,
      type: 'FUND',
      addedAmount: Number(addedAmount),
      oldFunds,
      newFunds,
      description: description || undefined,
    });

    await createAuditLog(req, {
      action: 'create',
      resource: 'transaction',
      resourceId: transaction._id.toString(),
      details: `Added ${addedAmount} to ${customer.fullname}'s credit (virement)`,
    });

    return res.status(200).send(transaction);
  } catch (error) {
    return next(error);
  }
};

const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await Transaction.find()
      .populate('customer')
      .sort('-createdAt');
    return res.status(200).send(transactions);
  } catch (error) {
    return next(error);
  }
};

const getByCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transactions = await Transaction.find({ customer: id })
      .populate('customer')
      .sort('-createdAt');
    return res.status(200).send(transactions);
  } catch (error) {
    return next(error);
  }
};

export {
  createFund,
  getAll,
  getByCustomer,
};
