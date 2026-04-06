import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title:      { type: String },
  image:      { url: String, public_id: String },
  link:       { type: String },
  position:   { type: String, enum: ['hero', 'sidebar', 'popup', 'banner-top', 'banner-mid'], default: 'hero' },
  isActive:   { type: Boolean, default: true },
  sortOrder:  { type: Number,  default: 0 },
  showFrom:   { type: Date },
  showUntil:  { type: Date },
}, { timestamps: true });

bannerSchema.index({ position: 1, isActive: 1 });
export const Banner = mongoose.model('Banner', bannerSchema);