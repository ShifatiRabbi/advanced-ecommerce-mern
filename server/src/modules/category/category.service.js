import slugify from 'slugify';
import { Category } from './category.model.js';
import { cloudinary } from '../../config/cloudinary.js';

const makeSlug = (name) => slugify(name, { lower: true, strict: true });

export const createCategory = async (data, file) => {
  const slug = data.slug || makeSlug(data.name);
  const exists = await Category.findOne({ slug });
  if (exists) { const e = new Error('Slug already exists'); e.status = 409; throw e; }

  const image = file ? { url: file.path, public_id: file.filename } : undefined;
  return Category.create({ ...data, slug, ...(image && { image }) });
};

export const getAllCategories = async ({ isActive } = {}) => {
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  return Category.find(filter).sort('sortOrder name').lean();
};

export const getCategoryBySlug = async (slug) => {
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) { const e = new Error('Category not found'); e.status = 404; throw e; }
  return cat;
};

export const updateCategory = async (id, data, file) => {
  const cat = await Category.findById(id);
  if (!cat) { const e = new Error('Category not found'); e.status = 404; throw e; }

  if (file) {
    if (cat.image?.public_id) await cloudinary.uploader.destroy(cat.image.public_id);
    data.image = { url: file.path, public_id: file.filename };
  }
  if (data.name && !data.slug) data.slug = makeSlug(data.name);

  return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteCategory = async (id) => {
  const cat = await Category.findById(id);
  if (!cat) { const e = new Error('Category not found'); e.status = 404; throw e; }
  if (cat.image?.public_id) await cloudinary.uploader.destroy(cat.image.public_id);
  await cat.deleteOne();
};