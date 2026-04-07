import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Slider }             from './slider.model.js';

const router = Router();

router.get('/',       asyncHandler(async(req,res) => {
  const filter = { isActive: true };
  if (req.query.position) filter.position = req.query.position;
  if (req.query.page)     filter.$or = [{ showOnPages: [] }, { showOnPages: req.query.page }];
  sendSuccess(res,{data: await Slider.find(filter).sort('sortOrder').lean()});
}));

router.get('/all',    protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await Slider.find().sort('sortOrder').lean()})));
router.get('/:id',    asyncHandler(async(req,res) => sendSuccess(res,{data:await Slider.findById(req.params.id).lean()})));
router.post('/',      protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{status:201,data:await Slider.create(req.body)})));
router.put('/:id',    protect, adminOnly, asyncHandler(async(req,res) => sendSuccess(res,{data:await Slider.findByIdAndUpdate(req.params.id,req.body,{new:true})})));
router.delete('/:id', protect, adminOnly, asyncHandler(async(req,res) => { await Slider.findByIdAndDelete(req.params.id); sendSuccess(res,{message:'Deleted'}); }));

export default router;