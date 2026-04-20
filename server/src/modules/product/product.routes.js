import { Router } from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { productUpload }     from '../../config/cloudinary.js';
import { validate }          from '../../middlewares/validate.middleware.js';
import { createProductSchema } from './product.validation.js';
import * as ctrl from './product.controller.js';
import * as ieCtrl from './productImportExport.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as svc from './product.service.js';

const router = Router();

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.get('/',                                ctrl.getAll);
router.get('/export',                          protect, adminOnly, ieCtrl.exportCsv);
router.post('/import',                         protect, adminOnly, importUpload.single('file'), ieCtrl.importCsv);
router.get('/featured',                        ctrl.getFeatured);
router.get('/slug/:slug',                      ctrl.getBySlug);
router.get('/slug/:slug/related',              ctrl.getRelated);
router.get('/:id',                             ctrl.getById);
router.post('/',  protect, adminOnly, productUpload.any(), validate(createProductSchema), ctrl.create);
router.put('/:id', protect, adminOnly, productUpload.any(), ctrl.update);
router.delete('/:id/images/:publicId', protect, adminOnly, ctrl.removeImage);
router.delete('/:id', protect, adminOnly, ctrl.remove);
router.post('/:id/variants',          protect, adminOnly, asyncHandler(async(req,res)=>{ sendSuccess(res,{data:await svc.addVariant(req.params.id,req.body)}); }));
router.put('/:id/variants/:idx',      protect, adminOnly, asyncHandler(async(req,res)=>{ sendSuccess(res,{data:await svc.updateVariant(req.params.id,Number(req.params.idx),req.body)}); }));
router.delete('/:id/variants/:idx',   protect, adminOnly, asyncHandler(async(req,res)=>{ sendSuccess(res,{data:await svc.deleteVariant(req.params.id,Number(req.params.idx))}); }));

export default router;