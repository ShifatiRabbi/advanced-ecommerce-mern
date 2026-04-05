import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { validate }           from '../../middlewares/validate.middleware.js';
import { createOrderSchema, incompleteOrderSchema } from './order.validation.js';
import * as ctrl from './order.controller.js';

const router = Router();

router.post('/incomplete',           validate(incompleteOrderSchema), ctrl.trackIncomplete);
router.post('/',                     validate(createOrderSchema),     ctrl.placeOrder);
router.get('/track/:orderNumber',    ctrl.trackOrder);
router.get('/my',                    protect, ctrl.myOrders);
router.get('/stats',                 protect, adminOnly, ctrl.stats);
router.get('/',                      protect, adminOnly, ctrl.getAll);
router.get('/:id',                   protect, adminOnly, ctrl.getOne);
router.patch('/:id/status',          protect, adminOnly, ctrl.updateStatus);

export default router;