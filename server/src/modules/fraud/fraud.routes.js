import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { getFraudReport }     from './fraud.service.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/:orderId', asyncHandler(async(req,res) => sendSuccess(res,{data:await getFraudReport(req.params.orderId)})));

export default router;