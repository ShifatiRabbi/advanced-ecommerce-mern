import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s]{7,15}$/).optional(),
  password: Joi.string().min(8).max(64).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});