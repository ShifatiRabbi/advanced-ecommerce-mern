import { Router } from 'express';
import userRoutes     from '../modules/user/user.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import brandRoutes    from '../modules/brand/brand.routes.js';
import productRoutes  from '../modules/product/product.routes.js';
import orderRoutes    from '../modules/order/order.routes.js';

const router = Router();

router.use('/auth',       userRoutes);
router.use('/settings',   settingsRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands',     brandRoutes);
router.use('/products',   productRoutes);
router.use('/orders',     orderRoutes);


router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

export default router;