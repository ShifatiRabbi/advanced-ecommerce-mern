import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  public_id: { type: String, required: true },
  alt:       { type: String, default: '' },
}, { _id: false });

const variantSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  options:  [{ label: String, priceModifier: { type: Number, default: 0 }, stock: { type: Number, default: 0 } }],
  defaultOptionIndex: { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true, maxlength: 200 },
    slug:          { type: String, required: true, unique: true, lowercase: true },
    description:   { type: String, maxlength: 5000 },
    shortDesc:     { type: String, maxlength: 300 },
    price:         { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    category:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand:         { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', index: true },
    stock:         { type: Number, default: 0, min: 0 },
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