import { EmailTemplate } from './emailTemplate.model.js';
import nodemailer         from 'nodemailer';
import { env }           from '../../config/env.js';

const DEFAULT_TEMPLATES = {
  welcome: {
    subject: 'Welcome to {{siteName}}!',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2e7d32">Welcome, {{name}}! 🎉</h2>
<p>Your account on <strong>{{siteName}}</strong> is ready.</p>
<p>Start shopping: <a href="{{shopUrl}}" style="color:#2e7d32">{{shopUrl}}</a></p>
<hr/><p style="color:#888;font-size:12px">{{siteName}} · {{siteAddress}}</p></div>`,
    variables: ['name','siteName','shopUrl','siteAddress'],
  },
  order_placed: {
    subject: 'Order Confirmed — {{orderNumber}} | {{siteName}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2e7d32">Order Placed! ✅</h2>
<p>Hi <strong>{{customerName}}</strong>, your order <strong>{{orderNumber}}</strong> has been placed.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">{{itemsHtml}}</table>
<p><strong>Total: ৳{{total}}</strong></p>
<p>Payment: {{paymentMethod}} | Deliver to: {{city}}</p>
<a href="{{trackUrl}}" style="display:inline-block;padding:10px 20px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px">Track Order</a>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['customerName','orderNumber','itemsHtml','total','paymentMethod','city','trackUrl','siteName'],
  },
  order_confirmed: {
    subject: 'Order Confirmed ✅ — {{orderNumber}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2e7d32">Your order is confirmed!</h2>
<p>Hi {{customerName}}, order <strong>{{orderNumber}}</strong> is confirmed and being prepared.</p>
<p>Expected delivery: <strong>2–5 days</strong></p>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['customerName','orderNumber','siteName'],
  },
  order_shipped: {
    subject: 'Your Order is Shipped 🚚 — {{orderNumber}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2e7d32">On the way!</h2>
<p>Hi {{customerName}}, order <strong>{{orderNumber}}</strong> has been shipped.</p>
<p>Tracking ID: <strong>{{trackingId}}</strong></p>
<p>Courier: <strong>{{courier}}</strong></p>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['customerName','orderNumber','trackingId','courier','siteName'],
  },
  order_delivered: {
    subject: 'Order Delivered ✅ — {{orderNumber}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2e7d32">Delivered!</h2>
<p>Hi {{customerName}}, your order <strong>{{orderNumber}}</strong> has been delivered.</p>
<p>We hope you love it! Please leave a review.</p>
<a href="{{reviewUrl}}" style="display:inline-block;padding:10px 20px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px">Write a Review</a>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['customerName','orderNumber','reviewUrl','siteName'],
  },
  order_cancelled: {
    subject: 'Order Cancelled — {{orderNumber}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#dc2626">Order Cancelled</h2>
<p>Hi {{customerName}}, your order <strong>{{orderNumber}}</strong> has been cancelled.</p>
<p>If you paid online, a refund will be processed within 5–7 days.</p>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['customerName','orderNumber','siteName'],
  },
  password_reset: {
    subject: 'Reset Your Password — {{siteName}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2>Reset Your Password</h2>
<p>Click the button below to reset your password. This link expires in 1 hour.</p>
<a href="{{resetLink}}" style="display:inline-block;padding:12px 24px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;font-weight:700">Reset Password</a>
<p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['resetLink','siteName'],
  },
  payment_received: {
    subject: 'Payment Received ✅ — Order {{orderNumber}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#2e7d32">Payment Confirmed!</h2>
<p>Hi {{customerName}}, we received your payment of <strong>৳{{amount}}</strong> for order <strong>{{orderNumber}}</strong>.</p>
<p>Transaction ID: <strong>{{transactionId}}</strong></p>
<hr/><p style="color:#888;font-size:12px">{{siteName}}</p></div>`,
    variables: ['customerName','orderNumber','amount','transactionId','siteName'],
  },
  low_stock_alert: {
    subject: 'Low Stock Alert — {{productName}}',
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#d97706">Low Stock Alert!</h2>
<p>Product <strong>{{productName}}</strong> has only <strong>{{stock}} units</strong> remaining.</p>
<a href="{{adminUrl}}/inventory" style="display:inline-block;padding:10px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;margin-top:12px">Go to Inventory</a>
</div>`,
    variables: ['productName','stock','adminUrl'],
  },
};

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   Number(env.SMTP_PORT) || 587,
  secure: env.SMTP_SECURE === 'true',
  auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const renderTemplate = (template, vars) => {
  let subject = template.subject;
  let body    = template.body;
  Object.entries(vars).forEach(([k, v]) => {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
    subject  = subject.replace(re, v ?? '');
    body     = body.replace(re, v ?? '');
  });
  return { subject, body };
};

export const seedDefaultTemplates = async () => {
  for (const [type, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
    await EmailTemplate.findOneAndUpdate(
      { type },
      { type, subject: tpl.subject, body: tpl.body, variables: tpl.variables, isActive: true },
      { upsert: true }
    );
  }
};

export const sendEmailByType = async (type, vars) => {
  if (!env.SMTP_USER) return;
  const tpl = await EmailTemplate.findOne({ type, isActive: true });
  if (!tpl) return;
  const { subject, body } = renderTemplate(tpl, { siteName: env.SITE_NAME || 'ShopBD', ...vars });
  await transporter.sendMail({
    from:    `"${env.SITE_NAME || 'ShopBD'}" <${env.SMTP_USER}>`,
    to:      vars.to,
    subject,
    html:    body,
  }).catch(err => console.error('[Email]', err.message));
};

export const getAllTemplates  = ()          => EmailTemplate.find().sort('type').lean();
export const getTemplateByType= (type)      => EmailTemplate.findOne({ type }).lean();
export const updateTemplate   = (type, data)=> EmailTemplate.findOneAndUpdate({ type }, data, { new: true });
export const sendTestEmail    = async (type, to) => {
  const tpl  = await EmailTemplate.findOne({ type });
  if (!tpl) throw Object.assign(new Error('Template not found'), { status: 404 });
  const vars = Object.fromEntries(tpl.variables.map(v => [v, `[${v}]`]));
  const { subject, body } = renderTemplate(tpl, { ...vars, siteName: env.SITE_NAME || 'ShopBD' });
  await transporter.sendMail({ from: `"${env.SITE_NAME}" <${env.SMTP_USER}>`, to, subject, html: body });
};