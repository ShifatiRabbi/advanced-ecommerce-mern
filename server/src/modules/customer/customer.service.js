import { User }  from '../user/user.model.js';
import { Order } from '../order/order.model.js';

export const getCustomers = async ({ page = 1, limit = 20, search, isActive } = {}) => {
  const filter = { role: 'customer' };
  if (search) filter.$or = [
    { name:  { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ];
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const [customers, total] = await Promise.all([
    User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ]);
  return { customers, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } };
};

export const getCustomerDetail = async (id) => {
  const customer = await User.findById(id).select('-password -refreshToken').lean();
  if (!customer) { const e = new Error('Customer not found'); e.status = 404; throw e; }
  const [orders, orderStats] = await Promise.all([
    Order.find({ user: id, status: { $nin: ['incomplete', 'fake'] } }).sort({ createdAt: -1 }).limit(10).lean(),
    Order.aggregate([
      { $match: { user: customer._id, status: { $nin: ['incomplete', 'fake', 'cancelled'] } } },
      { $group: { _id: null, totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    ]),
  ]);
  return {
    ...customer,
    orders,
    totalSpent:  orderStats[0]?.totalSpent  ?? 0,
    orderCount:  orderStats[0]?.orderCount  ?? 0,
  };
};

export const toggleBlock = async (id) => {
  const customer = await User.findById(id);
  if (!customer) { const e = new Error('Customer not found'); e.status = 404; throw e; }
  customer.isActive = !customer.isActive;
  return customer.save();
};