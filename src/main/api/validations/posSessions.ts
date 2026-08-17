import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const openSessionSchema = Joi.object({
  warehouse: Joi.string().optional(),
  openingCash: number.min(0).default(0),
  notes: string.optional().allow('').max(500),
});

const closeSessionSchema = Joi.object({
  actualCash: number.required().min(0),
  notes: string.optional().allow('').max(500),
});

const openSessionValidator = validator.body(openSessionSchema);
const closeSessionValidator = validator.body(closeSessionSchema);

export { openSessionValidator, closeSessionValidator };
