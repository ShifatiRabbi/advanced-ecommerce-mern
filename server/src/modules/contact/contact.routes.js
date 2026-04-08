import { Router } from 'express';
import { protect, adminOnly } from '../../middlewares/auth.middleware.js';
import { asyncHandler }       from '../../utils/asyncHandler.js';
import { sendSuccess }        from '../../utils/response.js';
import { Contact }            from './contact.model.js';
import { sendEmailByType }    from '../email/emailTemplate.service.js';

const router = Router();

// Public — submit contact form
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }
  const submission = await Contact.create({ name, email, phone, message });
  sendSuccess(res, { status: 201, data: submission, message: 'Message sent successfully!' });
}));

// Admin — list all messages
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = unreadOnly === 'true' ? { isRead: false } : {};
  const total   = await Contact.countDocuments(filter);
  const items   = await Contact.find(filter).sort('-createdAt')
    .skip((page - 1) * limit).limit(Number(limit)).lean();
  sendSuccess(res, { data: { messages: items, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
}));

// Admin — mark read
router.patch('/:id/read', protect, adminOnly, asyncHandler(async (req, res) => {
  const msg = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  sendSuccess(res, { data: msg });
}));

// Admin — reply
router.post('/:id/reply', protect, adminOnly, asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ success: false, message: 'Reply text is required' });
  const msg = await Contact.findByIdAndUpdate(req.params.id, { reply, isReplied: true, repliedAt: new Date() }, { new: true });
  // Send reply email
  await sendEmailByType('welcome', {
    to:      msg.email,
    name:    msg.name,
    siteName:'ShopBD',
    shopUrl: process.env.CLIENT_URL || '',
  }).catch(() => {});
  sendSuccess(res, { data: msg });
}));

// Admin — delete
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  sendSuccess(res, { message: 'Deleted' });
}));

export default router;