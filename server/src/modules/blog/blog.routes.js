import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './blog.service.js';

const router = Router();

router.get('/',         asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getPosts({ ...req.query, published: 'true' }) })));
router.get('/:slug',    asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getPostBySlug(req.params.slug) })));

router.use(protect, adminOnly);
router.get('/admin/all',asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getPosts(req.query) })));
router.post('/',         asyncHandler(async (req, res) => sendSuccess(res, { status: 201, data: await svc.createPost(req.body, req.user.id) })));
router.put('/:id',       asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.updatePost(req.params.id, req.body) })));
router.delete('/:id',    asyncHandler(async (req, res) => { await svc.deletePost(req.params.id); sendSuccess(res, { message: 'Deleted' }); }));

export default router;