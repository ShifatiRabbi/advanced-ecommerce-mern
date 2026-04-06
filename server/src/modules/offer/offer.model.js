import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:          { type: String, enum: ['percentage', 'fixed'], required: true },
  value:         { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount:   { type: Number, default: null },
  usageLimit:    { type: Number, default: null },
  usedCount:     { type: Number, default: 0 },
  expiresAt:     { type: Date },
  isActive:      { type: Boolean, default: true },
  applicableTo:  { type: String, enum: ['all', 'category', 'product'], default: 'all' },
  targetIds:     [{ type: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);