import mongoose from 'mongoose';

const timerSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  label:        { type: String, default: 'Offer ends in' },
  durationHours:{ type: Number, required: true },
  loopAfterHours:{ type: Number, default: null },
  startTime:    { type: Date,   default: Date.now },
  bgColor:      { type: String, default: '#ef4444' },
  textColor:    { type: String, default: '#ffffff' },
  isActive:     { type: Boolean, default: true },
  showOnAll:    { type: Boolean, default: false },
  productIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  categoryIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  position:     { type: String, enum: ['above-price','below-price','product-card','top-of-page'], default: 'above-price' },
}, { timestamps: true });

export const Timer = mongoose.model('Timer', timerSchema);