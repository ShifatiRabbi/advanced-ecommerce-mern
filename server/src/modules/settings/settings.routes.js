import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import * as ctrl from './settings.controller.js';

const router = Router();

router.get('/layout', ctrl.getLayout);
router.put('/layout', protect, adminOnly, ctrl.updateLayout);
router.get('/custom-code',  ctrl.getCustomCode);
router.put('/custom-code',  protect, adminOnly, ctrl.saveCustomCode);

export default router;