import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { array, date, mongooseId, number, object, string } from '../validations/schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createBillSchema = Joi.object({
  billDate: date.required(),
  orderId: number.required(),
  category: mongooseId,
  customer: mongooseId,
  type: string.required().valid('BUY', 'SALE', 'ORDER'),
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
    totalHT: number.required(),
    totalTTC: number.required(),
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
    otherwise: string.required(),
  }),
  description: string.optional().allow(''),
});

const createBillValidator = validator.body(createBillSchema);

export {
  createBillValidator,
};
