import Joi from 'joi';

export const createProductSchema = Joi.object({
  name:          Joi.string().min(2).max(200).required(),
  slug:          Joi.string().lowercase().optional(),
  description:   Joi.string().max(5000).optional(),
  shortDesc:     Joi.string().max(300).optional(),
  price:         Joi.number().min(0).optional(),
  basePrice:     Joi.number().min(0).optional(),
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
    title:       Joi.string().max(70).optional().allow(''),   // allow empty string
    description: Joi.string().max(160).optional().allow(''),  // allow empty string
    keywords:    Joi.array().items(Joi.string()).optional(),
  }).optional(),

  productType: Joi.string().valid('simple', 'variable', 'variation').default('simple'),

  variants: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    options: Joi.array().items(Joi.object({
      label: Joi.string().required(),
      sku: Joi.string().allow(null, ''),
      priceModifier: Joi.number().default(0),
      stock: Joi.number().min(0).default(0),
      // images handled via files + mapping in controller
    })).min(1),
    defaultOptionIndex: Joi.number().default(0)
  })).when('productType', {
    is: Joi.valid('variable', 'variation'),
    then: Joi.array().min(1).required(),
    otherwise: Joi.forbidden()
  })
})
  .custom((value, helpers) => {
    const type = value.productType === 'variation' ? 'variable' : value.productType;
    if (type === 'simple' && (value.price === undefined || value.price === null || value.price === '')) {
      return helpers.error('any.custom', { message: 'Price is required for simple products' });
    }
    if (type === 'variable') {
      const hasPrice = value.price !== undefined && value.price !== null && value.price !== '';
      const hasBasePrice = value.basePrice !== undefined && value.basePrice !== null && value.basePrice !== '';
      if (!hasPrice && !hasBasePrice) {
        return helpers.error('any.custom', { message: 'Base price is required for variable products' });
      }
    }
    return value;
  })
  .messages({
    'any.custom': '{{#message}}',
  });