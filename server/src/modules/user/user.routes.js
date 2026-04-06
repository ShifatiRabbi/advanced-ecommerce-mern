import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { registerSchema, loginSchema } from './user.validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import * as ctrl from './user.controller.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', protect, ctrl.logout);
router.get('/me', protect, ctrl.getMe);

router.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  await userService.requestPasswordReset(req.body.email, env.CLIENT_URL);
  sendSuccess(res, { message: 'If that email exists, a reset link was sent.' });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  await userService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, { message: 'Password reset successfully' });
}));

export default router;