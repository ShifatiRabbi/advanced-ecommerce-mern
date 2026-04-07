import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Menu }               from './menu.model.js';

const router = Router();

const DEFAULT_HEADER_MENU = [
  { id: 'home',     label: 'Home',     type: 'page',   url: '/',        target: '_self', children: [] },
  { id: 'shop',     label: 'Shop',     type: 'page',   url: '/shop',    target: '_self', children: [] },
  { id: 'blog',     label: 'Blog',     type: 'page',   url: '/blog',    target: '_self', children: [] },
  { id: 'contact',  label: 'Contact',  type: 'page',   url: '/contact', target: '_self', children: [] },
];

const DEFAULT_FOOTER_MENU = [
  { id: 'about',   label: 'About Us',    type: 'page', url: '/about',   target: '_self', children: [] },
  { id: 'privacy', label: 'Privacy',     type: 'page', url: '/privacy', target: '_self', children: [] },
  { id: 'terms',   label: 'Terms',       type: 'page', url: '/terms',   target: '_self', children: [] },
  { id: 'contact', label: 'Contact',     type: 'page', url: '/contact', target: '_self', children: [] },
];

router.get('/:key', asyncHandler(async (req, res) => {
  let menu = await Menu.findOne({ key: req.params.key }).lean();
  if (!menu) {
    menu = { key: req.params.key, items: req.params.key === 'header' ? DEFAULT_HEADER_MENU : DEFAULT_FOOTER_MENU };
  }
  sendSuccess(res, { data: menu });
}));

router.put('/:key', protect, adminOnly, asyncHandler(async (req, res) => {
  const menu = await Menu.findOneAndUpdate(
    { key: req.params.key },
    { items: req.body.items, key: req.params.key },
    { upsert: true, new: true }
  );
  sendSuccess(res, { data: menu });
}));

export default router;