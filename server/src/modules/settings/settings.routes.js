import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import * as ctrl from './settings.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as settingsService from './settings.service.js';

const router = Router();

router.get('/layout', ctrl.getLayout);
router.put('/layout', protect, adminOnly, ctrl.updateLayout);
router.get('/custom-code',  ctrl.getCustomCode);
router.put('/custom-code',  protect, adminOnly, ctrl.saveCustomCode);
router.get('/theme',        asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.getTheme()})));
router.put('/theme',        protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.updateTheme(req.body)})));
router.post('/theme/reset', protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.resetTheme()})));
router.get('/product-card-style',  asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.getProductCardStyle()})));
router.put('/product-card-style',  protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.updateProductCardStyle(req.body.style)})));
router.get('/all',  asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.getAllSettings()})));
router.put('/bulk', protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await settingsService.bulkUpdateSettings(req.body)})));

export default router;