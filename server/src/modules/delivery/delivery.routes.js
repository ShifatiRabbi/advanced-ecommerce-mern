import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { DeliveryZone }       from './delivery.model.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => sendSuccess(res, { data: await DeliveryZone.find({ isActive: true }).lean() })));

router.use(protect, adminOnly);
router.post('/',       asyncHandler(async (req, res) => sendSuccess(res, { status: 201, data: await DeliveryZone.create(req.body) })));
router.put('/:id',     asyncHandler(async (req, res) => sendSuccess(res, { data: await DeliveryZone.findByIdAndUpdate(req.params.id, req.body, { new: true }) })));
router.delete('/:id',  asyncHandler(async (req, res) => { await DeliveryZone.findByIdAndDelete(req.params.id); sendSuccess(res, { message: 'Zone deleted' }); }));

export default router;