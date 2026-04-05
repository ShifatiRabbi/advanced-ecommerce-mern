import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, maxlength: 80 },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 500 },
    image:       { url: String, public_id: String },
    parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive:    { type: Boolean, default: true },
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parent: 1 });

export const Category = mongoose.model('Category', categorySchema);