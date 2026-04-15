import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product:        Joi.string().required(),
      name:           Joi.string().required(),
      slug:           Joi.string().optional(),
      image:          Joi.string().optional().allow(''),
      qty:            Joi.number().integer().min(1).required(),
      unitPrice:      Joi.number().min(0).required(),
      total:          Joi.number().min(0).required(),
      variant:        Joi.string().optional().allow(null, ''),
      variantDetails: Joi.object().optional().allow(null),
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

  paymentMethod:  Joi.string().valid('cod', 'bkash', 'sslcommerz', 'manual').default('cod'),
  
  subtotal:       Joi.number().min(0).required(),
  shippingCharge: Joi.number().min(0).default(60),
  discount:       Joi.number().min(0).default(0),
  total:          Joi.number().min(0).required(),
  
  couponCode:     Joi.string().optional().allow(null, ''),   // ← Fixed
});

export const incompleteOrderSchema = Joi.object({
  phone:     Joi.string().required(),
  email:     Joi.string().email().optional().allow(''),
  sessionId: Joi.string().optional(),
  items:     Joi.array().items(
    Joi.object({ product: Joi.string(), qty: Joi.number() })
  ).optional(),
});