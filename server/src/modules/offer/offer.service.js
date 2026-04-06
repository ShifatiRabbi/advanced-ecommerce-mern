import { Coupon } from './offer.model.js';

export const createCoupon = (data) => Coupon.create({ ...data, code: data.code.toUpperCase() });

export const listCoupons = ({ page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  return Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Coupon.countDocuments(),
  ]).then(([coupons, total]) => ({ coupons, pagination: { total, pages: Math.ceil(total / limit) } }));
};

export const validateCoupon = async (code, orderTotal) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon)                              throw Object.assign(new Error('Invalid coupon'), { status: 404 });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw Object.assign(new Error('Coupon expired'), { status: 400 });
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw Object.assign(new Error('Coupon usage limit reached'), { status: 400 });
  if (orderTotal < coupon.minOrderValue)    throw Object.assign(new Error(`Minimum order ৳${coupon.minOrderValue} required`), { status: 400 });

  let discount = coupon.type === 'percentage'
    ? (orderTotal * coupon.value) / 100
    : coupon.value;

  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

  return { discount: Math.round(discount), couponId: coupon._id, code: coupon.code };
};

export const incrementUsage = (id) => Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } });
export const toggleCoupon   = async (id) => {
  const c = await Coupon.findById(id);
  c.isActive = !c.isActive;
  return c.save();
};
export const deleteCoupon = (id) => Coupon.findByIdAndDelete(id);