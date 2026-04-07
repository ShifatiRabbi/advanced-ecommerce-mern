import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { registerSchema, loginSchema } from './user.validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { User } from './user.model.js';
import * as ctrl from './user.controller.js';

console.log('--- DEBUGGING IMPORTS ---');
console.log('authLimiter is:', typeof authLimiter);
console.log('validate is:', typeof validate);
console.log('ctrl.login is:', typeof ctrl.login);
console.log('protect is:', typeof protect);
const router = Router();

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', protect, ctrl.logout);
router.get('/me', protect, ctrl.getMe);

router.put('/me', protect, asyncHandler(async (req,res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { new: true }).select('-password -refreshToken');
  sendSuccess(res, { data: user });
}));
router.post('/forgot-password', authLimiter, ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);

export default router;