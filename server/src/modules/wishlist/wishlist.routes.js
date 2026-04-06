import { Router }       from 'express';
import { protect }      from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import { Wishlist }     from './wishlist.model.js';

const router = Router();
router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const w = await Wishlist.findOne({ user: req.user.id }).populate('items', 'name slug price discountPrice images stock').lean();
  sendSuccess(res, { data: w?.items || [] });
}));

router.post('/toggle/:productId', asyncHandler(async (req, res) => {
  let w = await Wishlist.findOne({ user: req.user.id });
  if (!w) w = await Wishlist.create({ user: req.user.id, items: [] });
  const id = req.params.productId;
  const idx = w.items.findIndex(i => i.toString() === id);
  if (idx > -1) w.items.splice(idx, 1);
  else          w.items.push(id);
  await w.save();
  sendSuccess(res, { data: { wishlisted: idx === -1, count: w.items.length } });
}));

export default router;