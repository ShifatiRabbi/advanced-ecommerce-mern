import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Banner }             from './banner.model.js';
import { productUpload }      from '../../config/cloudinary.js';

const router = Router();

router.get('/',            asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.position) filter.position = req.query.position;
  const now = new Date();
  filter.$or = [{ showFrom: null }, { showFrom: { $lte: now } }];
  sendSuccess(res, { data: await Banner.find(filter).sort('sortOrder').lean() });
}));

router.use(protect, adminOnly);
router.get('/admin',       asyncHandler(async (req, res) => sendSuccess(res, { data: await Banner.find().sort('sortOrder').lean() })));
router.post('/',           productUpload.single('image'), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = { url: req.file.path, public_id: req.file.filename };
  sendSuccess(res, { status: 201, data: await Banner.create(data) });
}));
router.put('/:id',         productUpload.single('image'), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.image = { url: req.file.path, public_id: req.file.filename };
  sendSuccess(res, { data: await Banner.findByIdAndUpdate(req.params.id, data, { new: true }) });
}));
router.delete('/:id',      asyncHandler(async (req, res) => { await Banner.findByIdAndDelete(req.params.id); sendSuccess(res, { message: 'Deleted' }); }));

export default router;