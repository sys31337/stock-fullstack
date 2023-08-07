import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { date, mongooseId, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createCategorySchema = Joi.object({
  name: string.required(),
  description: string,
});

const createCategoryValidator = validator.body(createCategorySchema);

export {
  createCategoryValidator,
};
