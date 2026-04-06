import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './inventory.service.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/summary',       asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getStockSummary() })));
router.get('/low-stock',     asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getLowStockProducts(Number(req.query.threshold) || 10) })));
router.post('/bulk-update',  asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.bulkUpdateStock(req.body.updates) })));
router.patch('/:id/adjust',  asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.adjustStock(req.params.id, Number(req.body.delta), req.body.reason) })));

export default router;