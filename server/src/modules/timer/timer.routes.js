import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Timer }              from './timer.model.js';

const router = Router();

router.get('/', asyncHandler(async(req,res) => {
  const filter = { isActive: true };
  if (req.query.productId)  filter.$or = [{ showOnAll: true }, { productIds: req.query.productId }];
  if (req.query.categoryId) filter.$or = [{ showOnAll: true }, { categoryIds: req.query.categoryId }];
  sendSuccess(res, { data: await Timer.find(filter).lean() });
}));

router.get('/all', protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await Timer.find().populate('productIds','name').populate('categoryIds','name').lean()})));
router.post('/',   protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{status:201,data:await Timer.create({...req.body,startTime:new Date()})})));
router.put('/:id', protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await Timer.findByIdAndUpdate(req.params.id,req.body,{new:true})})));
router.patch('/:id/restart', protect, adminOnly, asyncHandler(async(req,res) => {
  const t = await Timer.findByIdAndUpdate(req.params.id, { startTime: new Date() }, { new: true });
  sendSuccess(res, { data: t });
}));
router.delete('/:id', protect, adminOnly, asyncHandler(async(req,res) => { await Timer.findByIdAndDelete(req.params.id); sendSuccess(res,{message:'Deleted'}); }));

export default router;