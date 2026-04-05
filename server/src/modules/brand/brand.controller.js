import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import * as svc from './brand.service.js';

export const create    = asyncHandler(async (req, res) => { sendSuccess(res, { status: 201, data: await svc.createBrand(req.body, req.file) }); });
export const getAll    = asyncHandler(async (req, res) => { sendSuccess(res, { data: await svc.getAllBrands() }); });
export const getBySlug = asyncHandler(async (req, res) => { sendSuccess(res, { data: await svc.getBrandBySlug(req.params.slug) }); });
export const update    = asyncHandler(async (req, res) => { sendSuccess(res, { data: await svc.updateBrand(req.params.id, req.body, req.file) }); });
export const remove    = asyncHandler(async (req, res) => { await svc.deleteBrand(req.params.id); sendSuccess(res, { message: 'Brand deleted' }); });