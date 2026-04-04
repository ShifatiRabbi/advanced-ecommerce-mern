import { Router } from 'express';
import userRoutes from '../modules/user/user.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';

const router = Router();

router.use('/auth', userRoutes);
router.use('/settings', settingsRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;