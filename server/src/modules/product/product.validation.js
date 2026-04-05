import Joi from 'joi';

export const createProductSchema = Joi.object({
  name:          Joi.string().min(2).max(200).required(),
  slug:          Joi.string().lowercase().optional(),
  description:   Joi.string().max(5000).optional(),
  shortDesc:     Joi.string().max(300).optional(),
  price:         Joi.number().positive().required(),
  discountPrice: Joi.number().positive().optional().allow(null),
  category:      Joi.string().required(),
  brand:         Joi.string().optional(),
  stock:         Joi.number().min(0).optional(),
  tags:          Joi.array().items(Joi.string()).optional(),
  sku:           Joi.string().optional(),
  weight:        Joi.number().optional(),
  isActive:      Joi.boolean().optional(),
  isFeatured:    Joi.boolean().optional(),
  meta: Joi.object({
    title:       Joi.string().max(70).optional(),
    description: Joi.string().max(160).optional(),
    keywords:    Joi.array().items(Joi.string()).optional(),
  }).optional(),
});