import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().required(),
      qty:     Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),

  shippingAddress: Joi.object({
    fullName: Joi.string().min(2).max(80).required(),
    phone:    Joi.string().required(),
    email:    Joi.string().email().optional().allow(''),
    address:  Joi.string().min(5).max(300).required(),
    city:     Joi.string().required(),
    district: Joi.string().optional().allow(''),
    zip:      Joi.string().optional().allow(''),
    note:     Joi.string().max(300).optional().allow(''),
  }).required(),

  paymentMethod: Joi.string().valid('cod', 'bkash', 'sslcommerz', 'manual').default('cod'),
  couponCode:    Joi.string().optional().allow(''),
});

export const incompleteOrderSchema = Joi.object({
  phone:     Joi.string().required(),
  email:     Joi.string().email().optional().allow(''),
  sessionId: Joi.string().optional(),
  items:     Joi.array().items(
    Joi.object({ product: Joi.string(), qty: Joi.number() })
  ).optional(),
});