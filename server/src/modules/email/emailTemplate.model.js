import mongoose from 'mongoose';

const EMAIL_TYPES = [
  'welcome', 'order_placed', 'order_confirmed', 'order_shipped',
  'order_delivered', 'order_cancelled', 'password_reset',
  'payment_received', 'low_stock_alert',
];

const emailTemplateSchema = new mongoose.Schema({
  type:    { type: String, required: true, unique: true, enum: EMAIL_TYPES },
  subject: { type: String, required: true },
  body:    { type: String, required: true },
  isActive:{ type: Boolean, default: true },
  variables:[{ type: String }],
}, { timestamps: true });

export const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);