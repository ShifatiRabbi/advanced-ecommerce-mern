import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { brandUpload } from '../../config/cloudinary.js';
import * as ctrl from './brand.controller.js';

const router = Router();

router.get('/',       ctrl.getAll);
router.get('/:slug',  ctrl.getBySlug);
router.post('/',      protect, adminOnly, brandUpload.single('logo'), ctrl.create);
router.put('/:id',    protect, adminOnly, brandUpload.single('logo'), ctrl.update);
router.delete('/:id', protect, adminOnly, ctrl.remove);

export default router;