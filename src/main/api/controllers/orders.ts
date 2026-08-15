import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import { IUserIdRequest } from '@api/types/common';
import { orderReleaseProducts, orderCompleteProducts } from '@api/functions/products';
import { createAuditLog } from '@api/utils/auditLog';
import { isSyncRecorderClientMode } from '@api/middlewares/syncRecorder';

const cancelOrder = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { params: { id }, body, userId } = req;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).send({ message: 'Order not found' });
    }

    if (bill.type !== 'ORDER') {
      return res.status(400).send({ message: 'Bill is not an order' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).send({ message: `Order is already ${bill.status}` });
    }

    if (!isSyncRecorderClientMode()) {
      await orderReleaseProducts(bill.products, bill.warehouse);
    }

    bill.status = 'cancelled';
    (bill as any).cancelledBy = userId;
    bill.cancelReason = body?.reason || '';
    await bill.save();

    await createAuditLog(req, {
      action: 'cancel',
      resource: 'order',
      resourceId: id,
      details: `Cancelled order #${bill.orderId}`,
    });

    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
};

const completeOrder = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { params: { id } } = req;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).send({ message: 'Order not found' });
    }

    if (bill.type !== 'ORDER') {
      return res.status(400).send({ message: 'Bill is not an order' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).send({ message: `Order is already ${bill.status}` });
    }

    if (!isSyncRecorderClientMode()) {
      await orderCompleteProducts(bill.products, bill.warehouse);
    }

    bill.status = 'completed';
    await bill.save();

    await createAuditLog(req, {
      action: 'approve',
      resource: 'order',
      resourceId: id,
      details: `Completed order #${bill.orderId}`,
    });

    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
};

export {
  cancelOrder,
  completeOrder,
};
