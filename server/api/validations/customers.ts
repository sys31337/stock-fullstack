import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { date, mongooseId, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createCustomerSchema = Joi.object({
  fullname: string.required(),
  address: string,
  phoneNumber: string,
  email: string,
  rc: string,
  nif: string,
  nar: string,
  type: string.required().valid('Client', 'Supplier'),
});

const createCustomerValidator = validator.body(createCustomerSchema);

export {
  createCustomerValidator,
};
