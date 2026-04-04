import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import * as ctrl from './settings.controller.js';

const router = Router();

router.get('/layout', ctrl.getLayout);
router.put('/layout', protect, adminOnly, ctrl.updateLayout);

export default router;