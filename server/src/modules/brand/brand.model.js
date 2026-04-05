import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 80 },
    slug:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo:     { url: String, public_id: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

brandSchema.index({ slug: 1 });
brandSchema.index({ isActive: 1 });

export const Brand = mongoose.model('Brand', brandSchema);