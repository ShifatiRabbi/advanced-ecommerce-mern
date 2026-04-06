import { Order }   from './order.model.js';
import { Product } from '../product/product.model.js';
import { detectFakeOrder } from '../../utils/fakeOrderDetector.js';
import { sendOrderSms } from '../marketing/marketing.service.js';
import { sendOrderConfirmation } from '../../utils/email.js';

export const saveIncompleteOrder = async ({ phone, email, sessionId, items, ip, userAgent }) => {
  const existing = await Order.findOne({
    'shippingAddress.phone': phone,
    status: 'incomplete',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  if (existing) {
    existing.userAgent = userAgent;
    existing.ip = ip;
    if (items?.length) existing.items = items;
    return existing.save();
  }

  return Order.create({
    shippingAddress: { fullName: 'Unknown', phone, email, address: 'N/A', city: 'N/A' },
    items: items || [],
    subtotal: 0,
    total: 0,
    status: 'incomplete',
    ip,
    userAgent,
    sessionId,
  });
};

export const createOrder = async ({ userId, items, shippingAddress, paymentMethod, couponCode, ip, userAgent }) => {
  const productIds = items.map((i) => i.product);
  const products   = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== items.length) {
    const err = new Error('One or more products are unavailable');
    err.status = 400;
    throw err;
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => p._id.toString() === item.product);
    if (!product) continue;

    if (product.stock < item.qty) {
      const err = new Error(`Insufficient stock for: ${product.name}`);
      err.status = 400;
      throw err;
    }

    const price = product.discountPrice || product.price;
    const lineTotal = price * item.qty;
    subtotal += lineTotal;

    orderItems.push({
      product:  product._id,
      name:     product.name,
      image:    product.images?.[0]?.url || '',
      price,
      qty:      item.qty,
      total:    lineTotal,
    });
  }

  const shippingCharge = subtotal >= 1000 ? 0 : 60;
  let discount = 0;

  const total = subtotal + shippingCharge - discount;

  const fakeCheck = detectFakeOrder({
    phone:   shippingAddress.phone,
    address: shippingAddress.address,
    city:    shippingAddress.city,
    items:   orderItems,
    total,
  });

  const order = await Order.create({
    user:            userId || null,
    items:           orderItems,
    shippingAddress,
    subtotal,
    shippingCharge,
    discount,
    total,
    paymentMethod,
    couponCode,
    status:          fakeCheck.isFake ? 'fake' : 'pending',
    isFake:          fakeCheck.isFake,
    fakeReason:      fakeCheck.reasons.join(', ') || null,
    ip,
    userAgent,
  });

  if (!fakeCheck.isFake) {
    sendOrderSms(order).catch(() => {});
    sendOrderConfirmation(order).catch(() => {});
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }
  }

  await Order.deleteMany({
    'shippingAddress.phone': shippingAddress.phone,
    status: 'incomplete',
  });

  return order;
};

export const getOrders = async ({ status, page = 1, limit = 20, search } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

export const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name slug images');
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
  return order;
};

export const getOrderByNumber = async (orderNumber) => {
  const order = await Order.findOne({ orderNumber })
    .populate('items.product', 'name slug images');
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
  return order;
};

export const updateOrderStatus = async (id, status, adminNote) => {
  const allowed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'fake'];
  if (!allowed.includes(status)) {
    const e = new Error('Invalid status'); e.status = 400; throw e;
  }
  return Order.findByIdAndUpdate(id, { status, ...(adminNote && { adminNote }) }, { new: true });
};

export const getUserOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find({ user: userId, status: { $ne: 'incomplete' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments({ user: userId, status: { $ne: 'incomplete' } }),
  ]);
  return { orders, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } };
};

export const getOrderStats = async () => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
  ]);

  const result = { total: 0, revenue: 0, byStatus: {} };
  for (const s of stats) {
    result.byStatus[s._id] = { count: s.count, revenue: s.revenue };
    if (s._id !== 'incomplete' && s._id !== 'fake' && s._id !== 'cancelled') {
      result.total += s.count;
      result.revenue += s.revenue;
    }
  }
  return result;
};