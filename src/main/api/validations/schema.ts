import Joi from 'joi';
import objectId from 'joi-objectid';

const mongooseObjectId = objectId(Joi);

export const mongooseId = mongooseObjectId();
export const string = Joi.string();
export const number = Joi.number();
export const boolean = Joi.bool();
export const date = Joi.date();
export const uri = Joi.string().uri();
export const array = Joi.array();
export const object = Joi.object();
