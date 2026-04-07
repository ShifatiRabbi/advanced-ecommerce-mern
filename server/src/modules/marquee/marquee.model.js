import mongoose from 'mongoose';

const marqueeSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  text:         { type: String, required: true },
  bg:           { type: String, default: '#111827' },
  textColor:    { type: String, default: '#ffffff' },
  speed:        { type: Number, default: 30 },
  isActive:     { type: Boolean, default: true },
  showOnAll:    { type: Boolean, default: false },
  productIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  categoryIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  showOnPages:  [{ type: String }],
  position:     { type: String, enum: ['top', 'below-header', 'above-footer', 'product-detail'], default: 'below-header' },
}, { timestamps: true });

export const Marquee = mongoose.model('Marquee', marqueeSchema);