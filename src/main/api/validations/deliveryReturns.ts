import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { mongooseId, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createDeliveryReturnSchema = Joi.object({
  deliveryPerson: mongooseId.required(),
  warehouse: mongooseId.optional(),
  deliveryDate: Joi.date().required(),
  enteredAmount: number.optional().default(0),
  returnedAmount: number.optional().default(0),
  status: string.optional().valid('pending', 'confirmed'),
  notes: string.optional().allow('').max(1000),
});

const updateDeliveryReturnSchema = Joi.object({
  warehouse: mongooseId.optional(),
  enteredAmount: number.optional(),
  returnedAmount: number.optional(),
  status: string.optional().valid('pending', 'confirmed'),
  notes: string.optional().allow('').max(1000),
});

const createDeliveryReturnValidator = validator.body(createDeliveryReturnSchema);
const updateDeliveryReturnValidator = validator.body(updateDeliveryReturnSchema);

export {
  createDeliveryReturnValidator,
  updateDeliveryReturnValidator,
};
