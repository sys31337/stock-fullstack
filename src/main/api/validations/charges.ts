import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { mongooseId, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createChargeSchema = Joi.object({
  date: Joi.date().required(),
  type: string.required().valid('salary', 'rent', 'utility', 'tax', 'marketing', 'maintenance', 'other'),
  amount: number.required().min(0),
  description: string.optional().allow('').max(500),
  paymentMethod: string.optional().valid('cash', 'bank', 'check', 'other').default('cash'),
  receiptRef: string.optional().allow('').max(200),
  warehouse: mongooseId.optional(),
});

const updateChargeSchema = Joi.object({
  date: Joi.date().optional(),
  type: string.optional().valid('salary', 'rent', 'utility', 'tax', 'marketing', 'maintenance', 'other'),
  amount: number.optional().min(0),
  description: string.optional().allow('').max(500),
  paymentMethod: string.optional().valid('cash', 'bank', 'check', 'other'),
  receiptRef: string.optional().allow('').max(200),
  warehouse: mongooseId.optional(),
});

const createChargeValidator = validator.body(createChargeSchema);
const updateChargeValidator = validator.body(updateChargeSchema);

export {
  createChargeValidator,
  updateChargeValidator,
};
