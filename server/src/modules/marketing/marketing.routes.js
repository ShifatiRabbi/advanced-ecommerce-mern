import { Router }       from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import * as svc from './marketing.service.js';

const router = Router();
router.get('/',           protect, adminOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getMarketingSettings() })));
router.put('/',           protect, adminOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.updateMarketingSettings(req.body) })));
router.post('/sms/bulk',  protect, adminOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.sendBulkSms(req.body) })));
export default router;