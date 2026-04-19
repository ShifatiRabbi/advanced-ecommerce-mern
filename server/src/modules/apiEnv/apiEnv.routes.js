import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as ctrl from './apiEnv.controller.js';
import { OVERRIDABLE_ENV_KEYS, AI_ENV_KEYS, EXTRA_SUGGESTED_ENV_KEYS } from '../../config/env.js';

const router = Router();

router.get(
  '/schema',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    sendSuccess(res, {
      data: {
        overridableKeys: OVERRIDABLE_ENV_KEYS,
        suggestedAdvancedKeys: [...AI_ENV_KEYS, ...EXTRA_SUGGESTED_ENV_KEYS],
      },
    });
  })
);

router.get('/', protect, adminOnly, ctrl.getConfig);
router.put('/', protect, adminOnly, ctrl.updateConfig);

export default router;
