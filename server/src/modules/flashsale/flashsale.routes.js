import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { FlashSale }          from './flashsale.model.js';

const router = Router();

router.get('/active', asyncHandler(async (req, res) => {
  const now  = new Date();
  const sale = await FlashSale.findOne({ isActive: true, startTime: { $lte: now }, endTime: { $gte: now } })
    .populate('items.product', 'name slug images').lean();
  sendSuccess(res, { data: sale });
}));

router.use(protect, adminOnly);
router.get('/',    asyncHandler(async (req, res) => sendSuccess(res, { data: await FlashSale.find().sort({ createdAt: -1 }).lean() })));
router.post('/',   asyncHandler(async (req, res) => sendSuccess(res, { status: 201, data: await FlashSale.create(req.body) })));
router.put('/:id', asyncHandler(async (req, res) => sendSuccess(res, { data: await FlashSale.findByIdAndUpdate(req.params.id, req.body, { new: true }) })));
router.delete('/:id', asyncHandler(async (req, res) => { await FlashSale.findByIdAndDelete(req.params.id); sendSuccess(res, { message: 'Deleted' }); }));

export default router;