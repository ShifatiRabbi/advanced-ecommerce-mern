import slugify from 'slugify';
import { Product } from './product.model.js';
import { cloudinary } from '../../config/cloudinary.js';

const makeSlug = (name) => slugify(name, { lower: true, strict: true });

const buildFilter = (query) => {
  const filter = { isActive: true };
  if (query.category)   filter.category = query.category;
  if (query.brand)      filter.brand = query.brand;
  if (query.featured === 'true') filter.isFeatured = true;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.search) filter.$text = { $search: query.search };
  return filter;
};

export const createProduct = async (data, files = []) => {
  const slug = data.slug || makeSlug(data.name);
  const exists = await Product.findOne({ slug });
  if (exists) { const e = new Error('Product slug exists'); e.status = 409; throw e; }

  const images = files.map((f) => ({ url: f.path, public_id: f.filename, alt: data.name }));
  return Product.create({ ...data, slug, images });
};

export const getProducts = async (query = {}) => {
  const filter   = buildFilter(query);
  const page     = Math.max(1, Number(query.page)  || 1);
  const limit    = Math.min(50, Number(query.limit) || 20);
  const skip     = (page - 1) * limit;

  const sortMap = {
    newest:   { createdAt: -1 },
    oldest:   { createdAt: 1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    popular:  { 'ratings.average': -1 },
  };
  const sort = sortMap[query.sort] || sortMap.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .select('-meta -__v')
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true })
    .populate('category', 'name slug')
    .populate('brand', 'name slug logo')
    .lean();
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  return product;
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate('brand', 'name slug logo')
    .lean();
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  return product;
};

export const updateProduct = async (id, data, files = []) => {
  const product = await Product.findById(id);
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }

  if (files.length > 0) {
    const newImages = files.map((f) => ({ url: f.path, public_id: f.filename, alt: data.name || product.name }));
    data.images = [...product.images, ...newImages];
  }
  if (data.name && !data.slug) data.slug = makeSlug(data.name);

  return Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteProductImage = async (productId, publicId) => {
  await cloudinary.uploader.destroy(publicId);
  return Product.findByIdAndUpdate(
    productId,
    { $pull: { images: { public_id: publicId } } },
    { new: true }
  );
};

export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  for (const img of product.images) {
    if (img.public_id) await cloudinary.uploader.destroy(img.public_id).catch(() => {});
  }
  await product.deleteOne();
};

export const getFeaturedProducts = async (limit = 8) =>
  Product.find({ isActive: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .lean();

export const getRelatedProducts = async (productId, categoryId, limit = 6) =>
  Product.find({ _id: { $ne: productId }, category: categoryId, isActive: true })
    .limit(limit)
    .populate('brand', 'name slug')
    .lean();