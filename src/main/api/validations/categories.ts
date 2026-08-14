import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { date, mongooseId, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createCategorySchema = Joi.object({
  _id: mongooseId,
  createdAt: date,
  updatedAt: date,
  name: string.required(),
  description: string.optional().allow(''),
});

const createCategoryValidator = validator.body(createCategorySchema);

export {
  createCategoryValidator,
};
