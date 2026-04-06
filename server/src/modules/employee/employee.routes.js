import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import * as svc from './employee.service.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/',               asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.listEmployees() })));
router.post('/',              asyncHandler(async (req, res) => sendSuccess(res, { status: 201, data: await svc.createEmployee(req.body) })));
router.put('/:id',            asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.updateEmployee(req.params.id, req.body) })));
router.patch('/:id/toggle',   asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.toggleEmployeeStatus(req.params.id) })));
router.get('/permissions',    asyncHandler(async (req, res) => sendSuccess(res, { data: svc.getPermissionTemplates() })));

export default router;