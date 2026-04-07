import { Router }       from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import * as svc from './courier.service.js';

const router = Router();
router.use(protect, adminOnly);

router.post('/pathao/create',        asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.pathaoCreateOrder(req.body)})));
router.get('/pathao/track/:id',      asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.pathaoTracking(req.params.id)})));
router.post('/steadfast/create',     asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.steadfastCreateOrder(req.body)})));
router.get('/steadfast/track/:inv',  asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.steadfastTracking(req.params.inv)})));

export default router;