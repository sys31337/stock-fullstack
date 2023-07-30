import Joi from 'joi';
import expressJoiValidation from 'express-joi-validation';
import { string } from './schema';

const validator = expressJoiValidation.createValidator({ passError: true });

const createAccountSchema = Joi.object({
  username: string.required(),
  email: string.required(),
  fullname: string.required(),
  phone: string.required(),
  password: string.required(),
});

const loginSchema = Joi.object({
  username: string.required(),
  password: string.required(),
});

const updateUserSchema = Joi.object({
  fullname: string,
  profilePicture: string,
  username: string,
  password: string,
});

const createAccountValidator = validator.body(createAccountSchema);
const loginValidator = validator.body(loginSchema);
const updateUserValidator = validator.body(updateUserSchema);

export {
  loginValidator, createAccountValidator, updateUserValidator,
};
