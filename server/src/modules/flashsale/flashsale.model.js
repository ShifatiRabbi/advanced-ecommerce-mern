import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  startTime:  { type: Date, required: true },
  endTime:    { type: Date, required: true },
  isActive:   { type: Boolean, default: true },
  items: [{
    product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    salePrice:     { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    quantity:      { type: Number, required: true },
    sold:          { type: Number, default: 0 },
  }],
}, { timestamps: true });

flashSaleSchema.index({ startTime: 1, endTime: 1, isActive: 1 });
export const FlashSale = mongoose.model('FlashSale', flashSaleSchema);