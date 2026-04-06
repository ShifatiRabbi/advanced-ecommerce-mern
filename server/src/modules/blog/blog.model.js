import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true, maxlength: 200 },
  slug:       { type: String, required: true, unique: true, lowercase: true },
  content:    { type: String, required: true },
  excerpt:    { type: String, maxlength: 300 },
  coverImage: { url: String, public_id: String },
  category:   { type: String, default: 'General' },
  tags:       [String],
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished:{ type: Boolean, default: false },
  publishedAt:{ type: Date },
  meta: { title: String, description: String },
}, { timestamps: true });

blogSchema.index({ slug: 1 });
blogSchema.index({ isPublished: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });

export const Blog = mongoose.model('Blog', blogSchema);