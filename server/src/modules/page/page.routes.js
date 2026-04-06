import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Page }               from './page.model.js';

const router = Router();

router.get('/:key',  asyncHandler(async (req,res) => {
  let page = await Page.findOne({ key: req.params.key }).lean();
  if (!page) page = { key: req.params.key, title: req.params.key, content: '', extra: {} };
  sendSuccess(res, { data: page });
}));

router.put('/:key', protect, adminOnly, asyncHandler(async (req,res) => {
  const page = await Page.findOneAndUpdate(
    { key: req.params.key },
    { ...req.body, key: req.params.key },
    { upsert: true, new: true, runValidators: false }
  );
  sendSuccess(res, { data: page });
}));

export default router;