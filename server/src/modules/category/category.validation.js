import Joi from 'joi';

export const categorySchema = Joi.object({
  name:      Joi.string().min(2).max(80).required(),
  slug:      Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().max(500).optional(),
  parent:    Joi.string().optional(),
  isActive:  Joi.boolean().optional(),
  sortOrder: Joi.number().optional(),
});