import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true }, // 'about','privacy','terms','contact'
  title:     { type: String, required: true },
  content:   { type: String, default: '' },   // rich HTML/text content
  metaTitle: { type: String },
  metaDesc:  { type: String },
  isActive:  { type: Boolean, default: true },
  extra:     { type: mongoose.Schema.Types.Mixed, default: {} }, // contact-specific: map, socials, details
}, { timestamps: true });

pageSchema.index({ key: 1 });
export const Page = mongoose.model('Page', pageSchema);