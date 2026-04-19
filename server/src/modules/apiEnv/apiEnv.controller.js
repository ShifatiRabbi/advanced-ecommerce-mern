import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as apiEnvService from './apiEnv.service.js';

export const getConfig = asyncHandler(async (req, res) => {
  const data = await apiEnvService.getAdminView();
  sendSuccess(res, { data });
});

export const updateConfig = asyncHandler(async (req, res) => {
  const data = await apiEnvService.upsertApiEnvConfig(req.body || {});
  sendSuccess(res, { message: 'API environment configuration saved. Runtime config updated.', data });
});
