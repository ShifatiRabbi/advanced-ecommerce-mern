import { Order }   from '../order/order.model.js';
import { Payment } from './payment.model.js';

export const confirmManualPayment = async ({ orderId, transactionId, amount, note, adminId }) => {
  const order = await Order.findById(orderId);
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }

  const payment = await Payment.create({
    order:         order._id,
    method:        'manual',
    status:        'paid',
    amount:        amount || order.total,
    transactionId: transactionId || `MAN-${Date.now()}`,
    note:          note || `Manually confirmed by admin`,
    verifiedAt:    new Date(),
    gatewayResponse: { confirmedBy: adminId, note },
  });

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    status:        'confirmed',
    paymentMethod: 'manual',
  });

  return payment;
};

export const getPaymentByOrder = async (orderId) =>
  Payment.findOne({ order: orderId }).sort({ createdAt: -1 }).lean();

export const getPayments = async ({ method, status, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (method) filter.method = method;
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate('order', 'orderNumber total shippingAddress status').lean(),
    Payment.countDocuments(filter),
  ]);
  return { payments, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } };
};