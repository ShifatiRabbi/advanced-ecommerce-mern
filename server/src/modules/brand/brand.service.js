import slugify from 'slugify';
import { Brand } from './brand.model.js';
import { cloudinary } from '../../config/cloudinary.js';

const makeSlug = (name) => slugify(name, { lower: true, strict: true });

export const createBrand = async (data, file) => {
  const slug = data.slug || makeSlug(data.name);
  const exists = await Brand.findOne({ slug });
  if (exists) { const e = new Error('Brand slug exists'); e.status = 409; throw e; }
  const logo = file ? { url: file.path, public_id: file.filename } : undefined;
  return Brand.create({ ...data, slug, ...(logo && { logo }) });
};

export const getAllBrands = async () =>
  Brand.find({ isActive: true }).sort('name').lean();

export const getBrandBySlug = async (slug) => {
  const brand = await Brand.findOne({ slug }).lean();
  if (!brand) { const e = new Error('Brand not found'); e.status = 404; throw e; }
  return brand;
};

export const updateBrand = async (id, data, file) => {
  const brand = await Brand.findById(id);
  if (!brand) { const e = new Error('Brand not found'); e.status = 404; throw e; }
  if (file) {
    if (brand.logo?.public_id) await cloudinary.uploader.destroy(brand.logo.public_id);
    data.logo = { url: file.path, public_id: file.filename };
  }
  if (data.name && !data.slug) data.slug = makeSlug(data.name);
  return Brand.findByIdAndUpdate(id, data, { new: true });
};

export const deleteBrand = async (id) => {
  const brand = await Brand.findById(id);
  if (!brand) { const e = new Error('Brand not found'); e.status = 404; throw e; }
  if (brand.logo?.public_id) await cloudinary.uploader.destroy(brand.logo.public_id);
  await brand.deleteOne();
};