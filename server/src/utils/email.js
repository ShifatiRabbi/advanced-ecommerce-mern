import nodemailer from 'nodemailer';
import { env }    from '../config/env.js';

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   Number(env.SMTP_PORT) || 587,
  secure: env.SMTP_SECURE === 'true',
  auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const orderConfirmHtml = (order) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>Order Confirmed — ${order.orderNumber}</h2>
  <p>Dear ${order.shippingAddress.fullName},</p>
  <p>Thank you for your order! Here's your summary:</p>
  <table style="width:100%;border-collapse:collapse">
    ${order.items.map(i => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.name} × ${i.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">৳${i.total}</td>
    </tr>`).join('')}
  </table>
  <p style="font-size:18px;font-weight:bold;margin-top:16px">Total: ৳${order.total}</p>
  <p>Delivery to: ${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
  <p>Payment: ${order.paymentMethod.toUpperCase()}</p>
  <hr/>
  <p style="color:#888;font-size:12px">This is an automated email. Please do not reply.</p>
</div>`;

export const sendOrderConfirmation = async (order) => {
  if (!env.SMTP_USER) return;
  const email = order.shippingAddress.email || order.user?.email;
  if (!email) return;
  await transporter.sendMail({
    from:    `"${env.SITE_NAME || 'My Shop'}" <${env.SMTP_USER}>`,
    to:      email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html:    orderConfirmHtml(order),
  });
};

export const sendPasswordReset = async (email, token, siteUrl) => {
  if (!env.SMTP_USER) return;
  const link = `${siteUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from:    `"${env.SITE_NAME || 'My Shop'}" <${env.SMTP_USER}>`,
    to:      email,
    subject: 'Reset your password',
    html:    `<p>Click <a href="${link}">here</a> to reset your password. Link expires in 1 hour.</p>`,
  });
};

export const sendWelcomeEmail = async (user) => {
  if (!env.SMTP_USER) return;
  await transporter.sendMail({
    from:    `"${env.SITE_NAME || 'My Shop'}" <${env.SMTP_USER}>`,
    to:      user.email,
    subject: `Welcome to ${env.SITE_NAME || 'My Shop'}!`,
    html:    `<h2>Welcome, ${user.name}!</h2><p>Your account is ready.</p>`,
  });
};