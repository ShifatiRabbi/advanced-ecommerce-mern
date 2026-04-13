import slugify from 'slugify';
import { Product } from './product.model.js';
import { cloudinary } from '../../config/cloudinary.js';

const makeSlug = (name) => slugify(name, { lower: true, strict: true });
const normalizeProductType = (type) => (type === 'variation' ? 'variable' : (type || 'simple'));
const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const parseVariants = (variants) => {
  if (!variants) return [];
  if (Array.isArray(variants)) return variants;
  if (typeof variants === 'string') {
    try {
      return JSON.parse(variants);
    } catch {
      return [];
    }
  }
  return [];
};
const sanitizeVariants = (variants = []) =>
  variants.map((variant) => ({
    name: variant.name,
    defaultOptionIndex: toNum(variant.defaultOptionIndex, 0),
    options: (variant.options || []).map((opt) => ({
      label: opt.label,
      sku: opt.sku || '',
      priceModifier: toNum(opt.priceModifier, 0),
      stock: toNum(opt.stock, 0),
      images: Array.isArray(opt.images) ? opt.images : [],
    })),
  }));
const getTotalVariantStock = (variants = []) =>
  variants.reduce((sum, variant) => (
    sum + (variant.options || []).reduce((optSum, opt) => optSum + toNum(opt.stock, 0), 0)
  ), 0);

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

  const productType = normalizeProductType(data.productType);
  const variants = sanitizeVariants(parseVariants(data.variants));
  const productData = { ...data, slug, productType };

  if (files?.length) {
    productData.images = files
      .filter((f) => f.fieldname === 'images')
      .map((f) => ({
        url: f.path,
        public_id: f.filename,
      }));
  }

  if (productType === 'variable') {
    const basePrice = toNum(data.basePrice ?? data.price, 0);
    productData.basePrice = basePrice;
    productData.price = basePrice;
    productData.stock = getTotalVariantStock(variants);
    productData.totalStock = productData.stock;
    productData.variants = variants;
  } else {
    productData.price = toNum(data.price, 0);
    productData.stock = toNum(data.stock, 0);
    productData.basePrice = undefined;
    productData.totalStock = productData.stock;
    productData.variants = [];
  }

  return Product.create(productData);
};

export const updateProduct = async (id, data, files = []) => {
  const product = await Product.findById(id);
  if (!product) throw { status: 404, message: 'Product not found' };

  const productType = normalizeProductType(data.productType || product.productType);
  product.productType = productType;

  if (files?.length) {
    const nextImages = files
      .filter((f) => f.fieldname === 'images')
      .map((f) => ({ url: f.path, public_id: f.filename }));
    product.images = [...(product.images || []), ...nextImages];
  }

  if (productType === 'variable') {
    const basePrice = data.basePrice ?? data.price ?? product.basePrice ?? product.price;
    product.basePrice = toNum(basePrice, 0);
    product.price = product.basePrice;
    if (data.variants) {
      product.variants = sanitizeVariants(parseVariants(data.variants));
    }
    const stockFromVariants = getTotalVariantStock(product.variants || []);
    product.stock = stockFromVariants;
    product.totalStock = stockFromVariants;
  } else {
    product.price = data.price !== undefined ? toNum(data.price, 0) : product.price;
    product.stock = data.stock !== undefined ? toNum(data.stock, 0) : product.stock;
    product.basePrice = undefined;
    product.totalStock = product.stock;
    product.variants = [];
  }

  if (data.name !== undefined) product.name = data.name;
  if (data.description !== undefined) product.description = data.description;
  if (data.shortDesc !== undefined) product.shortDesc = data.shortDesc;
  if (data.category !== undefined) product.category = data.category || null;
  if (data.brand !== undefined) product.brand = data.brand || null;
  if (data.discountPrice !== undefined) {
    product.discountPrice = data.discountPrice === '' || data.discountPrice === null
      ? null
      : toNum(data.discountPrice, 0);
  }
  if (data.sku !== undefined) product.sku = data.sku;
  if (data.weight !== undefined) product.weight = data.weight === '' ? null : toNum(data.weight, null);
  if (data.tags !== undefined) product.tags = Array.isArray(data.tags) ? data.tags : [data.tags];
  if (data.isActive !== undefined) product.isActive = data.isActive === true || data.isActive === 'true';
  if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured === true || data.isFeatured === 'true';

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