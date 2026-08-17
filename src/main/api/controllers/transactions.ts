import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import Customer from '@api/models/customers';
import Transaction from '@api/models/transactions';
import StockMovement from '@api/models/stockMovement';
import { IUserIdRequest } from '@api/types/common';
import { DEFAULT_CUSTOMER_ID } from '@api/functions/transactions';
import { deliveryProductUpdateHandler, buyBillproductUpdateHandler } from '@api/functions/products';
import { createAuditLog } from '@api/utils/auditLog';
import { isSyncRecorderClientMode } from '@api/middlewares/syncRecorder';

function deterministicMovementId(reference: string, barCode: string): string {
  return crypto.createHash('md5').update(`${reference}:${barCode}`).digest('hex').slice(0, 24);
}

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

const deleteOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid transaction id' });
    }

    const transaction = await Transaction.findById(id).populate('bill');
    if (!transaction) {
      return res.status(404).send({ message: 'Transaction not found' });
    }

    const customer = await Customer.findById(transaction.customer);
    if (customer) {
      const newFunds = Number(customer.credit || 0) - Number(transaction.addedAmount || 0);
      customer.credit = newFunds;
      await customer.save();
    }

    const bill = transaction.bill as any;
    if (bill && !isSyncRecorderClientMode()) {
      await StockMovement.deleteMany({ relatedBill: bill._id, type: { $in: ['OUT', 'IN'] } });
      if (bill.type === 'DELIVERY' || bill.type === 'SALE') {
        await deliveryProductUpdateHandler(bill.products || [], [], false, bill.warehouse);
        await StockMovement.create(
          (bill.products || []).map((p: any) => ({
            _id: deterministicMovementId(`DEL_REVERT_${bill._id}`, p.barCode || p.id),
            product: p.id,
            warehouse: bill.warehouse,
            type: 'RETURN',
            quantity: p.quantity,
            reference: `DEL_REVERT_${bill._id}`,
            relatedBill: bill._id,
            notes: `Delivery ${bill.orderId} deleted; stock restored`,
            createdBy: req.userId,
          })),
        );
      } else if (bill.type === 'BUY') {
        await buyBillproductUpdateHandler(bill.products || [], [], bill.warehouse);
        await StockMovement.create(
          (bill.products || []).map((p: any) => ({
            _id: deterministicMovementId(`BUY_REVERT_${bill._id}`, p.barCode || p.id),
            product: p.id,
            warehouse: bill.warehouse,
            type: 'OUT',
            quantity: p.quantity,
            reference: `BUY_REVERT_${bill._id}`,
            relatedBill: bill._id,
            notes: `Purchase bill ${bill.orderId} deleted; stock removed`,
            createdBy: req.userId,
          })),
        );
      }
      await bill.deleteOne();
    }

    await transaction.deleteOne();

    await createAuditLog(req, {
      action: 'delete',
      resource: 'transaction',
      resourceId: id,
      details: `Deleted transaction for ${customer?.fullname || transaction.customer}; credit reversed`,
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

export {
  createFund,
  getAll,
  getByCustomer,
  deleteOne,
};
