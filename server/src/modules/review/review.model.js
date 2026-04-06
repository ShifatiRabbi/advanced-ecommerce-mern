import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  title:     { type: String, maxlength: 100 },
  comment:   { type: String, maxlength: 1000 },
  isVisible: { type: Boolean, default: true },
  images:    [{ url: String, public_id: String }],
  helpfulCount: { type: Number, default: 0 },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isVisible: 1 });

reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isVisible: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      'ratings.average': +stats[0].avg.toFixed(1),
      'ratings.count':    stats[0].count,
    });
  }
});

export const Review = mongoose.model('Review', reviewSchema);