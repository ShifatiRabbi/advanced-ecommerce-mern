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
  if (await Product.findOne({ slug })) {
    const e = new Error('Product slug already exists'); e.status = 409; throw e;
  }

  let images = [];
  // Separate main images vs variant images (you need to send metadata from frontend)
  // Example: req.body.variantImages = { "0-0": ["file1", "file2"] } etc.

  const productData = { ...data, slug };

  if (data.productType === 'variable' && data.variants) {
    productData.basePrice = data.price;
    productData.price = null; // or keep as base
    // You can calculate totalStock here
  }

  // Handle images (main + variant-specific)
  // This part needs coordination with frontend (e.g. via formData with keys)

  return Product.create(productData);
};

export const updateProduct = async (id, data, files = []) => {
  const product = await Product.findById(id);
  if (!product) throw { status: 404, message: 'Product not found' };

  if (data.productType === 'variable') {
    product.basePrice = data.price || product.basePrice;
    product.price = null;
  } else {
    product.price = data.price;
  }

  // Merge variants if sent
  if (data.variants) {
    product.variants = data.variants;
  }

  // Handle new files...
  return product.save();
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

export const addVariant = async (productId, variant) => {
  const product = await Product.findById(productId);
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  product.variants.push(variant);
  return product.save();
};

export const updateVariant = async (productId, variantIndex, data) => {
  const product = await Product.findById(productId);
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  if (!product.variants[variantIndex]) { const e = new Error('Variant not found'); e.status = 404; throw e; }
  Object.assign(product.variants[variantIndex], data);
  return product.save();
};

export const deleteVariant = async (productId, variantIndex) => {
  const product = await Product.findById(productId);
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  product.variants.splice(variantIndex, 1);
  return product.save();
};