import mongoose from 'mongoose';

const checkoutFieldSchema = new mongoose.Schema({
  id:           { type: String, required: true },
  label:        { type: String, required: true },
  placeholder:  { type: String, default: '' },
  type:         { type: String, enum: ['text','email','tel','textarea','select','radio','checkbox'], default: 'text' },
  name:         { type: String, required: true },
  required:     { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  options:      [String],
  width:        { type: String, enum: ['full','half'], default: 'full' },
  sortOrder:    { type: Number, default: 0 },
  defaultValue: { type: String, default: '' },
}, { _id: false });

const paymentMethodConfigSchema = new mongoose.Schema({
  key:       { type: String, required: true },
  label:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  icon:      { type: String, default: '' },
  note:      { type: String, default: '' },
}, { _id: false });

const checkoutConfigSchema = new mongoose.Schema({
  fields:         [checkoutFieldSchema],
  paymentMethods: [paymentMethodConfigSchema],
}, { timestamps: true });

export const CheckoutConfig = mongoose.model('CheckoutConfig', checkoutConfigSchema);