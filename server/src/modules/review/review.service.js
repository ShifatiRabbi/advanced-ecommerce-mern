import { Review }  from './review.model.js';
import { Order }   from '../order/order.model.js';

export const createReview = async ({ userId, productId, rating, title, comment }) => {
  const hasPurchased = await Order.findOne({
    user: userId,
    'items.product': productId,
    status: 'delivered',
  });
  if (!hasPurchased) throw Object.assign(new Error('You can only review products you have purchased and received'), { status: 403 });

  const existing = await Review.findOne({ user: userId, product: productId });
  if (existing)    throw Object.assign(new Error('You have already reviewed this product'), { status: 409 });

  return Review.create({ user: userId, product: productId, rating, title, comment });
};

export const getProductReviews = async (productId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [reviews, total] = await Promise.all([
    Review.find({ product: productId, isVisible: true })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('user', 'name').lean(),
    Review.countDocuments({ product: productId, isVisible: true }),
  ]);
  return { reviews, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } };
};

export const moderateReview = (id, isVisible) =>
  Review.findByIdAndUpdate(id, { isVisible }, { new: true });

export const getAllReviews = async ({ page = 1, limit = 20, isVisible } = {}) => {
  const filter = {};
  if (isVisible !== undefined) filter.isVisible = isVisible === 'true';
  const skip = (Number(page) - 1) * Number(limit);
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('user', 'name email').populate('product', 'name slug').lean(),
    Review.countDocuments(filter),
  ]);
  return { reviews, pagination: { total, pages: Math.ceil(total / limit) } };
};