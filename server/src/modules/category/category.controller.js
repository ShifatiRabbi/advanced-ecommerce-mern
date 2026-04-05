import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as svc from './category.service.js';

export const create  = asyncHandler(async (req, res) => {
  const cat = await svc.createCategory(req.body, req.file);
  sendSuccess(res, { status: 201, data: cat });
});

export const getAll  = asyncHandler(async (req, res) => {
  const cats = await svc.getAllCategories(req.query);
  sendSuccess(res, { data: cats });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const cat = await svc.getCategoryBySlug(req.params.slug);
  sendSuccess(res, { data: cat });
});

export const update  = asyncHandler(async (req, res) => {
  const cat = await svc.updateCategory(req.params.id, req.body, req.file);
  sendSuccess(res, { data: cat });
});

export const remove  = asyncHandler(async (req, res) => {
  await svc.deleteCategory(req.params.id);
  sendSuccess(res, { message: 'Category deleted' });
});