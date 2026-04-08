import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String },
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  isReplied: { type: Boolean, default: false },
  reply:     { type: String },
  repliedAt: { type: Date },
}, { timestamps: true });

export const Contact = mongoose.model('Contact', contactSchema);