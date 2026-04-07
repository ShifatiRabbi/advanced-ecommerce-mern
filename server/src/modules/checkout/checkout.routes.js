import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './checkout.service.js';

const router = Router();
router.get('/',  asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.getCheckoutConfig()})));
router.put('/',  protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.updateCheckoutConfig(req.body)})));
export default router;