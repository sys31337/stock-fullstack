import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import StockMovement from '@api/models/stockMovement';
import Product from '@api/models/products';
import { orderReleaseProducts } from '@api/functions/products';
import { IUserIdRequest } from '@api/types/common';
import { buyBillProductHandler, buyBillproductUpdateHandler, orderReserveProducts, deliveryDecrementProducts, deliveryProductUpdateHandler } from '@api/functions/products';
import { getLatestBill } from '@api/functions/bills';
import { IProduct } from '@api/types/IProducts';
import { createAuditLog } from '@api/utils/auditLog';
import { checkWarehouseAccess } from '@api/middlewares/warehouseAccess';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const { type, products, category, customer, orderId, warehouse } = body;

    if (warehouse) {
      const hasAccess = await checkWarehouseAccess(warehouse, userId as string);
      if (!hasAccess) {
        return res.status(403).send({ message: 'Access denied to this warehouse' });
      }
    }

    const finalOrderId = orderId > 0 ? orderId : parseInt(await getLatestBill(type), 10) + 1;

    const existing = await Bill.findOne({ type, orderId: finalOrderId });
    if (existing) {
      return res.status(409).send({ message: `Order ID ${finalOrderId} already exists for type ${type}` });
    }

    const payload: any = {
      ...body,
      orderId: finalOrderId,
      createBy: userId,
      warehouse: warehouse || req.defaultWarehouse,
      ...(type === 'ORDER' && { status: 'pending' }),
    };

    if (type === 'BUY') {
      await buyBillProductHandler(products.map((product: IProduct) => ({ ...product, category, customer })));
      for (const product of products) {
        const dbProduct = await Product.findOne({ barCode: product.barCode });
        if (dbProduct) {
          await StockMovement.create({
            product: dbProduct._id,
            warehouse: payload.warehouse,
            type: 'IN',
            quantity: product.quantity,
            unitPrice: product.buyPrice,
            totalPrice: Number(product.buyPrice) * Number(product.quantity),
            reference: `BUY-${finalOrderId}`,
            relatedBill: undefined,
            createdBy: userId,
          });
        }
      }
    }

    if (type === 'ORDER') {
      await orderReserveProducts(products);
      for (const product of products) {
        const dbProduct = await Product.findOne({ barCode: product.barCode });
        if (dbProduct) {
          await StockMovement.create({
            product: dbProduct._id,
            warehouse: payload.warehouse,
            type: 'OUT',
            quantity: -Number(product.quantity),
            reference: `ORDER-${finalOrderId}`,
            createdBy: userId,
          });
        }
      }
    }

    if (type === 'DELIVERY' && !body.convertFromOrder) {
      await deliveryDecrementProducts(products);
      for (const product of products) {
        const dbProduct = await Product.findOne({ barCode: product.barCode });
        if (dbProduct) {
          await StockMovement.create({
            product: dbProduct._id,
            warehouse: payload.warehouse,
            type: 'OUT',
            quantity: -Number(product.quantity),
            reference: `DELIVERY-${finalOrderId}`,
            createdBy: userId,
          });
        }
      }
    }

    if (type === 'DELIVERY' && body.convertFromOrder) {
      for (const product of products) {
        const dbProduct = await Product.findOne({ barCode: product.barCode });
        if (dbProduct) {
          await StockMovement.create({
            product: dbProduct._id,
            warehouse: payload.warehouse,
            type: 'OUT',
            quantity: -Number(product.quantity),
            reference: `DELIVERY-CONV-${body.convertFromOrder}-${finalOrderId}`,
            createdBy: userId,
          });
        }
      }
    }

    delete payload.convertFromOrder;
    const createBill = await new Bill(payload).save();

    await createAuditLog(req, {
      action: 'create',
      resource: 'bill',
      resourceId: createBill._id.toString(),
      details: `Created ${type} bill #${finalOrderId}`,
    });

    return res.status(200).send(createBill);
  } catch (error) {
    return next(error);
  }
};

const updateOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId, params: { id } } = req;
    const payload: any = {
      ...body,
      updatedBy: userId,
    };

    const oldBill = await Bill.findById(id).lean();

    if (!oldBill) {
      return res.status(404).send({ message: 'Bill not found' });
    }

    if (oldBill.type === 'ORDER') {
      return res.status(400).send({ message: `${oldBill.type} bills cannot be updated via this endpoint.` });
    }

    const { products: oldProducts } = oldBill || { products: [] };
    const { products: newProducts, category, customer } = body;

    if (!newProducts || newProducts.length === 0) {
      return res.status(400).send({ message: 'Products array is missing or empty' });
    }

    const oldProductsArr = oldProducts.map((product: IProduct) => ({ ...product, category, customer }));
    const newProductsArr = newProducts.map((product: IProduct) => ({ ...product, category, customer }));

    if (oldBill.type === 'DELIVERY') {
      await deliveryProductUpdateHandler(oldProductsArr, newProductsArr);

      for (const product of oldProducts) {
        const dbProduct = await Product.findOne({ barCode: product.barCode });
        if (dbProduct) {
          await StockMovement.create({
            product: dbProduct._id,
            warehouse: oldBill.warehouse,
            type: 'IN',
            quantity: Number(product.quantity),
            unitPrice: Number(product.buyPrice),
            totalPrice: Number(product.buyPrice) * Number(product.quantity),
            reference: `DELIVERY-UPDATE-REVERT-${oldBill.orderId}`,
            relatedBill: oldBill._id,
            createdBy: userId,
          });
        }
      }

      for (const product of newProducts) {
        const dbProduct = await Product.findOne({ barCode: product.barCode });
        if (dbProduct) {
          await StockMovement.create({
            product: dbProduct._id,
            warehouse: body.warehouse || oldBill.warehouse,
            type: 'OUT',
            quantity: -Number(product.quantity),
            unitPrice: Number(product.buyPrice),
            totalPrice: Number(product.buyPrice) * Number(product.quantity),
            reference: `DELIVERY-UPDATE-${oldBill.orderId}`,
            relatedBill: oldBill._id,
            createdBy: userId,
          });
        }
      }
    } else {
      await buyBillproductUpdateHandler(oldProductsArr, newProductsArr);
    }

    const updateBill = await Bill.findByIdAndUpdate(id, payload, { new: true });

    await createAuditLog(req, {
      action: 'edit',
      resource: 'bill',
      resourceId: id,
      details: `Updated ${oldBill.type} bill #${oldBill.orderId}`,
    });

    return res.status(200).send(updateBill);
  } catch (error) {
    return next(error);
  }
};

const getBillsOfType = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const { warehouse } = req.query;

    if (type === 'ORDER') {
      const now = new Date();
      const expiredOrders = await Bill.find({
        type: 'ORDER',
        status: 'pending',
        reservedUntil: { $lte: now },
      });
      for (const order of expiredOrders) {
        await orderReleaseProducts(order.products);
        order.status = 'cancelled';
        await order.save();
      }
    }

    const filter: any = { type };
    if (warehouse) {
      filter.warehouse = warehouse;
    } else if (!req.isMainAccount && req.assignedWarehouses?.length) {
      filter.warehouse = { $in: req.assignedWarehouses };
    }

    const bills = await Bill.find(filter).populate('customer category warehouse').sort('-createdAt').lean();
    return res.status(200).send(bills);
  } catch (error) {
    return next(error);
  }
};

const getAllBills = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { warehouse } = req.query;
    const filter: any = {};
    if (warehouse) {
      filter.warehouse = warehouse;
    } else if (!req.isMainAccount && req.assignedWarehouses?.length) {
      filter.warehouse = { $in: req.assignedWarehouses };
    }
    const bills = await Bill.find(filter);
    return res.status(200).send(bills);
  } catch (error) {
    return next(error);
  }
};

const getSingleBill = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id).populate('customer category warehouse');
    return res.status(200).send(bill);
  } catch (error) {
    return next(error);
  }
};

const checkOrderIdExists = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { type, orderId } = req.params;
    const existing = await Bill.findOne({ type, orderId: Number(orderId) });
    return res.status(200).send({ exists: !!existing });
  } catch (error) {
    return next(error);
  }
};

export {
  createOne,
  updateOne,
  getBillsOfType,
  getAllBills,
  getSingleBill,
  checkOrderIdExists,
};
