import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import * as ctrl from './payment.controller.js';

const router = Router();

router.post('/ssl/init',      protect, ctrl.initSSL);
router.post('/ssl/success',            ctrl.sslSuccess);
router.post('/ssl/fail',               ctrl.sslFail);
router.post('/ssl/cancel',             ctrl.sslCancel);
router.post('/ssl/ipn',                ctrl.sslIPN);

router.post('/bkash/create',   protect, ctrl.createBkash);
router.get('/bkash/callback',           ctrl.bkashCallback);
router.post('/bkash/refund',   protect, adminOnly, ctrl.refundBkash);

router.post('/manual/confirm', protect, adminOnly, ctrl.confirmManual);

router.get('/',                protect, adminOnly, ctrl.getPayments);
router.get('/order/:orderId',  protect, adminOnly, ctrl.getOrderPayment);

export default router;