import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './review.service.js';

const router = Router();

router.get('/product/:productId',    asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getProductReviews(req.params.productId, req.query) })));
router.post('/',                     protect, asyncHandler(async (req, res) => sendSuccess(res, { status: 201, data: await svc.createReview({ userId: req.user.id, ...req.body }) })));
router.get('/admin',                 protect, adminOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getAllReviews(req.query) })));
router.patch('/:id/moderate',        protect, adminOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.moderateReview(req.params.id, req.body.isVisible) })));

export default router;