import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './emailTemplate.service.js';

const router = Router();

router.get('/',             protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.getAllTemplates()})));
router.get('/:type',        protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.getTemplateByType(req.params.type)})));
router.put('/:type',        protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await svc.updateTemplate(req.params.type,req.body)})));
router.post('/test/:type',  protect, adminOnly, asyncHandler(async(req,res) => { await svc.sendTestEmail(req.params.type,req.body.to); sendSuccess(res,{message:'Test email sent'}); }));
router.post('/seed',        protect, adminOnly, asyncHandler(async(req,res) => { await svc.seedDefaultTemplates(); sendSuccess(res,{message:'Templates seeded'}); }));

export default router;