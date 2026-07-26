import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
const validator = expressJoiValidation.createValidator({ passError: true });

const updateSettingsSchema = Joi.object({
  allowOutOfStockSales: Joi.boolean().optional(),
  allowOutOfStockOrders: Joi.boolean().optional(),
}).min(1);

export const updateSettingsValidator = validator.body(updateSettingsSchema);
