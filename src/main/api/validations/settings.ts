import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
const validator = expressJoiValidation.createValidator({ passError: true });

const updateSettingsSchema = Joi.object({
  allowOutOfStockSales: Joi.boolean().optional(),
  allowOutOfStockOrders: Joi.boolean().optional(),
  companyName: Joi.string().allow('').optional(),
  rc: Joi.string().allow('').optional(),
  nif: Joi.string().allow('').optional(),
  ai: Joi.string().allow('').optional(),
  nis: Joi.string().allow('').optional(),
  companyAddress: Joi.string().allow('').optional(),
  companyPhone: Joi.string().allow('').optional(),
  mobile: Joi.string().allow('').optional(),
  website: Joi.string().allow('').optional(),
  email: Joi.string().allow('').optional(),
  wilaya: Joi.string().allow('').optional(),
  accountNumber: Joi.string().allow('').optional(),
  rib: Joi.string().allow('').optional(),
  articleNumber: Joi.string().allow('').optional(),
  stamp: Joi.number().optional(),
  tva: Joi.number().optional(),
}).min(1);

export const updateSettingsValidator = validator.body(updateSettingsSchema);
