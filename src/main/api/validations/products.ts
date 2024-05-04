import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { boolean, number, string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createProductSchema = Joi.object({
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
});

const updateProductSchema = Joi.object({
  id: string,
  barCode: string,
  productName: string,
  quantity: number,
  stack: number,
  buyPrice: number,
  sellPrice_1: number,
  sellPrice_2: number,
  sellPrice_3: number,
  totalHT: number,
  totalTTC: number,
  tva: number,
  notify: boolean,
});

const createProductValidator = validator.body(createProductSchema);
const updateProductValidator = validator.body(updateProductSchema);

export {
  createProductValidator,
  updateProductValidator,
};
