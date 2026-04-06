import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './offer.service.js';

const router = Router();

router.post('/validate', asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.validateCoupon(req.body.code, req.body.orderTotal) })));

router.use(protect, adminOnly);
router.get('/',              asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.listCoupons(req.query) })));
router.post('/',             asyncHandler(async (req, res) => sendSuccess(res, { status: 201, data: await svc.createCoupon(req.body) })));
router.patch('/:id/toggle',  asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.toggleCoupon(req.params.id) })));
router.delete('/:id',        asyncHandler(async (req, res) => { await svc.deleteCoupon(req.params.id); sendSuccess(res, { message: 'Deleted' }); }));

export default router;