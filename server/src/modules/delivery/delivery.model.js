import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  zone:       { type: String, required: true, trim: true },
  areas:      [{ type: String }],
  charge:     { type: Number, required: true, min: 0 },
  minDays:    { type: Number, default: 1 },
  maxDays:    { type: Number, default: 3 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

deliverySchema.index({ zone: 1 });
export const DeliveryZone = mongoose.model('DeliveryZone', deliverySchema);