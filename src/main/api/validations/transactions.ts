import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { mongooseId, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createTransactionSchema = Joi.object({
  customer: mongooseId.required(),
  type: string.required().valid('FUND'),
  addedAmount: number.required().positive(),
  description: string.optional().allow('').max(500),
});

const createTransactionValidator = validator.body(createTransactionSchema);

export {
  createTransactionValidator,
};
