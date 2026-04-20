import mongoose from 'mongoose';

// Updated imageSchema (allow per-variant images)
const imageSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  public_id: { type: String, required: true },
  alt:       { type: String, default: '' },
  variantOptionIndex: { type: Number, default: null }, // null = main product image
}, { _id: false });

// Updated variant option
const variantOptionSchema = new mongoose.Schema({
  label:          { type: String, required: true },
  sku:            { type: String, sparse: true },
  regularPrice:   { type: Number, min: 0, default: 0 },
  salePrice:      { type: Number, default: null },
  priceModifier:  { type: Number, default: 0 },     // can be negative
  price:          { type: Number },                 // final calculated price (optional, for quick access)
  stock:          { type: Number, default: 0, min: 0 },
  images:         [imageSchema],                    // ← per option images
}, { _id: false });

const variantSchema = new mongoose.Schema({
  name:               { type: String, required: true },   // e.g. "Size", "Color"
  options:            [variantOptionSchema],
  defaultOptionIndex: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true, maxlength: 200 },
    slug:          { type: String, required: true, unique: true, lowercase: true },
    description:   { type: String, maxlength: 5000 },
    shortDesc:     { type: String, maxlength: 300 },
    discountPrice: { type: Number, default: null },
    category:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand:         { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    
    productType: { type: String, enum: ['simple', 'variable'], default: 'simple' },
    // For simple products
    price:         { type: Number, required: true, min: 0 },
    stock:         { type: Number, default: 0 },
    // For variable products (these become fallback / base)
    basePrice:     { type: Number },
    totalStock:    { type: Number, default: 0 },   // calculated
    
    images:        [imageSchema],
    variants:      [variantSchema],
    tags:          [{ type: String, lowercase: true }],
    sku:           { type: String, sparse: true },
    weight:        { type: Number },
    isActive:      { type: Boolean, default: true, index: true },
    isFeatured:    { type: Boolean, default: false, index: true },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
    meta: {
      title:       String,
      description: String,
      keywords:    [String],
    },
    /** WooCommerce / Shopify CSV round-trip & dedupe on import */
    integration: {
      woocommerceProductId: { type: String, trim: true, sparse: true },
      shopifyHandle:        { type: String, trim: true, lowercase: true, sparse: true },
    },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, tags: 5, description: 1 } }
);

export const Product = mongoose.model('Product', productSchema);