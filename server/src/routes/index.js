import { Router } from 'express';
import userRoutes      from '../modules/user/user.routes.js';
import settingsRoutes  from '../modules/settings/settings.routes.js';
import categoryRoutes  from '../modules/category/category.routes.js';
import brandRoutes     from '../modules/brand/brand.routes.js';
import productRoutes   from '../modules/product/product.routes.js';
import orderRoutes     from '../modules/order/order.routes.js';
import paymentRoutes   from '../modules/payment/payment.routes.js';
import employeeRoutes  from '../modules/employee/employee.routes.js';
import customerRoutes  from '../modules/customer/customer.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import offerRoutes     from '../modules/offer/offer.routes.js';
import deliveryRoutes  from '../modules/delivery/delivery.routes.js';
import blogRoutes      from '../modules/blog/blog.routes.js';
import os              from 'os';

const router = Router();

router.use('/auth',       userRoutes);
router.use('/settings',   settingsRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands',     brandRoutes);
router.use('/products',   productRoutes);
router.use('/orders',     orderRoutes);
router.use('/payment',    paymentRoutes);
router.use('/employees',  employeeRoutes);
router.use('/customers',  customerRoutes);
router.use('/inventory',  inventoryRoutes);
router.use('/offers',     offerRoutes);
router.use('/delivery',   deliveryRoutes);
router.use('/blog',       blogRoutes);

router.get('/health', (req, res) => res.json({
  success: true, status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}));

router.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    data: {
      uptime:      process.uptime(),
      memoryMB: {
        rss:       +(mem.rss / 1024 / 1024).toFixed(1),
        heapUsed:  +(mem.heapUsed / 1024 / 1024).toFixed(1),
        heapTotal: +(mem.heapTotal / 1024 / 1024).toFixed(1),
      },
      cpuLoad: os.loadavg(),
      platform: os.platform(),
      nodeVersion: process.version,
    },
  });
});

export default router;