import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { categoryUpload } from '../../config/cloudinary.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { categorySchema } from './category.validation.js';
import * as ctrl from './category.controller.js';

const router = Router();

router.get('/',        ctrl.getAll);
router.get('/:slug',   ctrl.getBySlug);
router.post('/',       protect, adminOnly, categoryUpload.single('image'), validate(categorySchema), ctrl.create);
router.put('/:id',     protect, adminOnly, categoryUpload.single('image'), ctrl.update);
router.delete('/:id',  protect, adminOnly, ctrl.remove);

export default router;