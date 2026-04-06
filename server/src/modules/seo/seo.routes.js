import { Router }       from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import * as svc from './seo.service.js';

const router = Router();

router.get('/settings',         asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.getSeoSettings() })));
router.get('/sitemap.xml',      asyncHandler(async (req, res) => {
  const xml = await svc.generateSitemap();
  res.header('Content-Type', 'application/xml').send(xml);
}));
router.get('/robots.txt',       asyncHandler(async (req, res) => {
  const seo = await svc.getSeoSettings();
  res.header('Content-Type', 'text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${seo.siteUrl}/sitemap.xml`
  );
}));
router.put('/settings',         protect, adminOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await svc.updateSeoSettings(req.body) })));

export default router;