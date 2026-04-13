import Joi from 'joi';

/**
 * Factory — returns an Express middleware that validates req.body against a Joi schema.
 * Rejects with 422 on first validation failure; never auto-corrects input.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: false });
  if (error) {
    res.status(422);
    return next(new Error(error.details[0].message));
  }
  next();
};

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const validateRegister = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(60).required().messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must be at most 60 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().trim().email().lowercase().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
  })
);

export const validateLogin = validate(
  Joi.object({
    email: Joi.string().trim().email().lowercase().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  })
);

// ── Order schema ──────────────────────────────────────────────────────────────

const shippingAddressSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  street: Joi.string().trim().min(3).max(200).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  province: Joi.string().trim().min(2).max(80).required(),
  postalCode: Joi.string().trim().min(3).max(20).required(),
});

const orderItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().max(200).required(),
  image: Joi.string().uri().required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(1).max(100).required(),
});

export const validateOrder = validate(
  Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).required(),
    shippingAddress: shippingAddressSchema.required(),
    paymentMethod: Joi.string()
      .valid('cod', 'bank-transfer', 'easypaisa', 'jazzcash')
      .required(),
    totalPrice: Joi.number().positive().required(),
    couponCode: Joi.string().trim().uppercase().max(30).allow('').optional(),
    discount: Joi.number().min(0).optional(),
  })
);

// ── Product schema (JSON body fields — multipart handled separately) ──────────

export const validateProduct = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    price: Joi.number().positive().required(),
    category: Joi.string()
      .valid('handbags', 'tote-bags', 'clutches', 'shoulder-bags', 'crossbody', 'wallets')
      .required(),
    stock: Joi.number().integer().min(0).optional(),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional(),
    lowStockThreshold: Joi.number().integer().min(0).optional(),
  })
);

export const validateProductUpdate = validate(
  Joi.object({
    name: Joi.string().trim().min(2).max(200).optional(),
    description: Joi.string().trim().min(10).max(2000).optional(),
    price: Joi.number().positive().optional(),
    category: Joi.string()
      .valid('handbags', 'tote-bags', 'clutches', 'shoulder-bags', 'crossbody', 'wallets')
      .optional(),
    stock: Joi.number().integer().min(0).optional(),
    isActive: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional(),
    lowStockThreshold: Joi.number().integer().min(0).optional(),
  })
);
