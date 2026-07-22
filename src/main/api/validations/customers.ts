import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createCustomerSchema = Joi.object({
  fullname: string.required(),
  address: string.optional().allow(''),
  phoneNumber: string.optional().allow(''),
  email: string.optional().allow(''),
  rc: string.optional().allow(''),
  nif: string.optional().allow(''),
  nar: string.optional().allow(''),
  type: string.required().valid('Client', 'Supplier'),
});

const updateCustomerSchema = Joi.object({
  fullname: string.optional(),
  address: string.optional().allow(''),
  phoneNumber: string.optional().allow(''),
  email: string.optional().allow(''),
  rc: string.optional().allow(''),
  nif: string.optional().allow(''),
  nar: string.optional().allow(''),
  type: string.optional().valid('Client', 'Supplier'),
});

const createCustomerValidator = validator.body(createCustomerSchema);
const updateCustomerValidator = validator.body(updateCustomerSchema);

export {
  createCustomerValidator,
  updateCustomerValidator,
};
