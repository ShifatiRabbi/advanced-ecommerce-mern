import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './customer.service.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/',              asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getCustomers(req.query) })));
router.get('/:id',           asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getCustomerDetail(req.params.id) })));
router.patch('/:id/toggle',  asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.toggleBlock(req.params.id) })));

export default router;