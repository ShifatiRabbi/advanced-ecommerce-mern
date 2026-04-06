import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as settingsService from './settings.service.js';

export const getLayout = asyncHandler(async (req, res) => {
  const settings = await settingsService.getLayoutSettings();
  sendSuccess(res, { data: settings });
});

export const updateLayout = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateLayoutSettings(req.body);
  sendSuccess(res, { message: 'Layout updated', data: settings });
});

export const getCustomCode  = asyncHandler(async (req, res) => sendSuccess(res, { data: await settingsService.getCustomCode() }));
export const saveCustomCode = asyncHandler(async (req, res) => sendSuccess(res, { data: await settingsService.saveCustomCode(req.body) }));