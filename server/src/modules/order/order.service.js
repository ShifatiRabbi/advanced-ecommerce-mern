import { Order }   from './order.model.js';
import { Product } from '../product/product.model.js';
import { detectFakeOrder } from '../../utils/fakeOrderDetector.js';
import { sendOrderSms } from '../marketing/marketing.service.js';
import { sendEmailByType } from '../email/emailTemplate.service.js';

// --- CONFIG ---
const STATUS_EMAIL_MAP = {
  confirmed: 'order_confirmed',
  shipped:   'order_shipped',
  delivered: 'order_delivered',
  cancelled: 'order_cancelled',
};

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

// server/src/modules/order/order.service.js — createOrder:
export const createOrder = async (userId, body) => {
  const {
    items, shippingAddress, paymentMethod,
    subtotal, shippingCharge, discount = 0, total,
    couponCode,
  } = body;

  // Validate items exist + are still in stock
  for (const item of items) {
    const product = await Product.findById(item.product).select('stock name price discountPrice').lean();
    if (!product) throw Object.assign(new Error(`Product not found: ${item.product}`), { status: 400 });
    if (product.stock < item.qty) {
      throw Object.assign(
        new Error(`"${product.name}" only has ${product.stock} in stock, but ${item.qty} requested`),
        { status: 400 }
      );
    }
  }

  // Decrement stock
  await Promise.all(items.map(item =>
    Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
  ));

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user:            userId || null,
    items:           items.map(item => ({
      product:       item.product,
      name:          item.name,
      slug:          item.slug,
      image:         item.image,
      qty:           item.qty,
      unitPrice:     item.unitPrice,
      total:         item.total,
      variant:       item.variant || null,          // "Size: XL, Color: Red"
      variantDetails:item.variantDetails || null,   // { Size: 'XL', Color: 'Red' }
    })),
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    status:        'pending',
    subtotal:      subtotal  || items.reduce((s, i) => s + i.total, 0),
    shippingCharge:shippingCharge || 60,
    discount:      discount || 0,
    total:         total || (subtotal + (shippingCharge || 60) - (discount || 0)),
    couponCode:    couponCode || null,
  });
  if (!fakeCheck.isFake) {
    // 1. Send SMS (Existing)
    sendOrderSms(order).catch(() => {});

    // 2. Send New Email Template (Replaces sendOrderConfirmation)
    if (order.shippingAddress?.email) {
      sendEmailByType('order_placed', {
        to:            order.shippingAddress.email,
        customerName:  order.shippingAddress.fullName,
        orderNumber:   order.orderNumber,
        itemsHtml:     order.items.map(i => `<tr><td>${i.name} ×${i.qty}</td><td>৳${i.total}</td></tr>`).join(''),
        total:         order.total.toLocaleString(),
        paymentMethod: order.paymentMethod.toUpperCase(),
        city:          order.shippingAddress.city,
        trackUrl:      `${process.env.CLIENT_URL}/order-success/${order.orderNumber}`,
      }).catch(() => {});
    }

    // 3. Update Inventory
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }
  }

  await Order.deleteMany({
    'shippingAddress.phone': shippingAddress.phone,
    status: 'incomplete',
  });

  // Apply coupon usage
  if (couponCode) {
    await Offer.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
  }

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

  const order = await Order.findByIdAndUpdate(
    id, 
    { status, ...(adminNote && { adminNote }) }, 
    { new: true }
  );

  // New Status Email Logic
  const emailType = STATUS_EMAIL_MAP[status];
  if (order && emailType && order.shippingAddress?.email) {
    sendEmailByType(emailType, {
      to:           order.shippingAddress.email,
      customerName: order.shippingAddress.fullName,
      orderNumber:  order.orderNumber,
      trackingId:   order.trackingId || '—',
      courier:      order.courier   || '—',
      reviewUrl:    `${process.env.CLIENT_URL}/product/${order.items?.[0]?.slug || ''}`,
    }).catch(() => {});
  }

  return order;
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