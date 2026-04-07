import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  id:       { type: String, required: true },
  label:    { type: String, required: true },
  type:     { type: String, enum: ['page', 'category', 'custom', 'blog'], default: 'custom' },
  url:      { type: String, default: '' },
  pageKey:  { type: String },
  target:   { type: String, enum: ['_self', '_blank'], default: '_self' },
  children: { type: Array, default: [] },
}, { _id: false });

const menuSchema = new mongoose.Schema({
  key:      { type: String, required: true, unique: true }, // 'header', 'footer'
  items:    [menuItemSchema],
}, { timestamps: true });

menuSchema.index({ key: 1 });
export const Menu = mongoose.model('Menu', menuSchema);