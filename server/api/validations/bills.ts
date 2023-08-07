import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { date, mongooseId, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createBillSchema = Joi.object({
  billDate: date.required(),
  orderId: string.required(),
  category: mongooseId.required(),
  customer: mongooseId.required(),
  type: string.required().valid('BUY', 'SALE', 'ORDER'),
  products: string.required(),
  orderTotalHT: number.required(),
  orderTotalTTC: number.required(),
  orderPaid: number.required(),
  orderDebts: number.required(),
  paymentMethod: string.required(),
  pricingCategory: string,
  description: string,
});

const createBillValidator = validator.body(createBillSchema);

export {
  createBillValidator,
};
