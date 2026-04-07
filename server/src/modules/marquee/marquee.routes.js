import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Marquee }            from './marquee.model.js';

const router = Router();

router.get('/', asyncHandler(async(req,res) => {
  const filter = { isActive: true };
  if (req.query.productId)  filter.$or = [{ showOnAll: true }, { productIds: req.query.productId }];
  if (req.query.categoryId) filter.$or = [{ showOnAll: true }, { categoryIds: req.query.categoryId }];
  if (req.query.page)       filter.$or = [{ showOnAll: true }, { showOnPages: req.query.page }];
  sendSuccess(res, { data: await Marquee.find(filter).lean() });
}));

router.get('/all', protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await Marquee.find().populate('productIds','name').populate('categoryIds','name').lean()})));
router.post('/',   protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{status:201,data:await Marquee.create(req.body)})));
router.put('/:id', protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await Marquee.findByIdAndUpdate(req.params.id,req.body,{new:true})})));
router.delete('/:id', protect, adminOnly, asyncHandler(async(req,res) => { await Marquee.findByIdAndDelete(req.params.id); sendSuccess(res,{message:'Deleted'}); }));

export default router;