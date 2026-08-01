import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { array, date, mongooseId, number, object, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createBillSchema = Joi.object({
  billDate: date.required(),
  orderId: string.optional().allow(''),
  category: mongooseId,
  customer: mongooseId,
  type: string.required().valid('BUY', 'SALE', 'ORDER', 'DELIVERY'),
  products: array.items(object.keys({
    id: string.required(),
    barCode: string.required(),
    productName: string.required(),
    quantity: number.required(),
    stack: number.required(),
    buyPrice: number.required(),
    sellPrice_1: number.required(),
    sellPrice_2: number.required(),
    sellPrice_3: number.required(),
    totalHT: number,
    totalTTC: number,
    tva: number.required(),
  })).min(1),
  orderTotalHT: number.required(),
  orderTotalTTC: number.required(),
  orderPaid: number.required(),
  orderDebts: number.required(),
  paymentMethod: string.required(),
  pricingCategory: Joi.when('type', {
    is: 'BUY',
    then: Joi.forbidden(),
    otherwise: number.required(),
  }),
  warehouse: mongooseId,
  description: string.optional().allow(''),
  reservedUntil: date.optional(),
  status: string.optional().valid('pending', 'cancelled', 'completed'),
  convertFromOrder: string.optional(),
});

const createBillValidator = validator.body(createBillSchema);

const updateBillSchema = Joi.object({
  billDate: date,
  orderId: string.optional().allow(''),
  category: mongooseId,
  customer: mongooseId,
  type: string.valid('BUY', 'SALE', 'ORDER', 'DELIVERY'),
  products: array.items(object.keys({
    id: string.required(),
    barCode: string.required(),
    productName: string.required(),
    quantity: number.required(),
    stack: number.required(),
    buyPrice: number.required(),
    sellPrice_1: number.required(),
    sellPrice_2: number.required(),
    sellPrice_3: number.required(),
    totalHT: number,
    totalTTC: number,
    tva: number.required(),
  })),
  orderTotalHT: number,
  orderTotalTTC: number,
  orderPaid: number,
  orderDebts: number,
  paymentMethod: string,
  pricingCategory: number,
  warehouse: mongooseId,
  description: string.optional().allow(''),
  reservedUntil: date.optional(),
  status: string.optional().valid('pending', 'cancelled', 'completed'),
});

const updateBillValidator = validator.body(updateBillSchema);

export {
  createBillValidator,
  updateBillValidator,
};
