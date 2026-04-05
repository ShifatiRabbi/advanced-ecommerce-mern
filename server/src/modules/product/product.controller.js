import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import * as svc from './product.service.js';

export const create     = asyncHandler(async (req, res) => {
  const p = await svc.createProduct(req.body, req.files || []);
  sendSuccess(res, { status: 201, data: p });
});

export const getAll     = asyncHandler(async (req, res) => {
  const result = await svc.getProducts(req.query);
  sendSuccess(res, { data: result });
});

export const getBySlug  = asyncHandler(async (req, res) => {
  const p = await svc.getProductBySlug(req.params.slug);
  sendSuccess(res, { data: p });
});

export const getById    = asyncHandler(async (req, res) => {
  const p = await svc.getProductById(req.params.id);
  sendSuccess(res, { data: p });
});

export const update     = asyncHandler(async (req, res) => {
  const p = await svc.updateProduct(req.params.id, req.body, req.files || []);
  sendSuccess(res, { data: p });
});

export const removeImage = asyncHandler(async (req, res) => {
  const p = await svc.deleteProductImage(req.params.id, req.params.publicId);
  sendSuccess(res, { data: p });
});

export const remove     = asyncHandler(async (req, res) => {
  await svc.deleteProduct(req.params.id);
  sendSuccess(res, { message: 'Product deleted' });
});

export const getFeatured = asyncHandler(async (req, res) => {
  const products = await svc.getFeaturedProducts(Number(req.query.limit) || 8);
  sendSuccess(res, { data: products });
});

export const getRelated  = asyncHandler(async (req, res) => {
  const p = await svc.getProductBySlug(req.params.slug);
  const related = await svc.getRelatedProducts(p._id, p.category._id);
  sendSuccess(res, { data: related });
});