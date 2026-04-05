import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { productUpload }     from '../../config/cloudinary.js';
import { validate }          from '../../middlewares/validate.middleware.js';
import { createProductSchema } from './product.validation.js';
import * as ctrl from './product.controller.js';

const router = Router();

router.get('/',                                ctrl.getAll);
router.get('/featured',                        ctrl.getFeatured);
router.get('/slug/:slug',                      ctrl.getBySlug);
router.get('/slug/:slug/related',              ctrl.getRelated);
router.get('/:id',                             ctrl.getById);
router.post('/',  protect, adminOnly, productUpload.array('images', 8), validate(createProductSchema), ctrl.create);
router.put('/:id', protect, adminOnly, productUpload.array('images', 8), ctrl.update);
router.delete('/:id/images/:publicId', protect, adminOnly, ctrl.removeImage);
router.delete('/:id', protect, adminOnly, ctrl.remove);

export default router;