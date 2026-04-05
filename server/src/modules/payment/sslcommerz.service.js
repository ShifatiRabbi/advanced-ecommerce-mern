import SSLCommerzPayment from 'sslcommerz-lts';
import { Order }   from '../order/order.model.js';
import { Payment } from './payment.model.js';
import { env }     from '../../config/env.js';

const isLive = env.SSL_IS_LIVE === 'true';

export const initiateSSLPayment = async (orderId) => {
  const order = await Order.findById(orderId).populate('user', 'name email phone');
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
  if (order.paymentStatus === 'paid') {
    const e = new Error('Order already paid'); e.status = 400; throw e;
  }

  const tranId = `SSL-${order.orderNumber}-${Date.now()}`;

  const data = {
    total_amount:        order.total,
    currency:            'BDT',
    tran_id:             tranId,
    success_url:         env.SSL_SUCCESS_URL,
    fail_url:            env.SSL_FAIL_URL,
    cancel_url:          env.SSL_CANCEL_URL,
    ipn_url:             env.SSL_IPN_URL,
    shipping_method:     'Courier',
    product_name:        `Order ${order.orderNumber}`,
    product_category:    'eCommerce',
    product_profile:     'general',
    cus_name:            order.shippingAddress.fullName,
    cus_email:           order.shippingAddress.email || 'noemail@shop.com',
    cus_add1:            order.shippingAddress.address,
    cus_city:            order.shippingAddress.city,
    cus_country:         'Bangladesh',
    cus_phone:           order.shippingAddress.phone,
    ship_name:           order.shippingAddress.fullName,
    ship_add1:           order.shippingAddress.address,
    ship_city:           order.shippingAddress.city,
    ship_country:        'Bangladesh',
    multi_card_name:     'mastercard,visacard,othercards,internetbank,mobilebank',
    value_a:             order._id.toString(),
  };

  const sslcz  = new SSLCommerzPayment(env.SSL_STORE_ID, env.SSL_STORE_PASS, isLive);
  const apiRes = await sslcz.init(data);

  if (!apiRes?.GatewayPageURL) {
    throw new Error('Failed to initiate SSLCommerz payment: ' + (apiRes?.failedreason || 'Unknown'));
  }

  await Payment.create({
    order:        order._id,
    method:       'sslcommerz',
    status:       'initiated',
    amount:       order.total,
    transactionId:tranId,
    gatewayRef:   apiRes.sessionkey,
    gatewayResponse: apiRes,
  });

  await Order.findByIdAndUpdate(order._id, { paymentMethod: 'sslcommerz' });

  return { GatewayPageURL: apiRes.GatewayPageURL, tranId };
};

export const handleSSLSuccess = async (body) => {
  const { tran_id, val_id, status, value_a: orderId } = body;

  if (status !== 'VALID' && status !== 'VALIDATED') {
    return { success: false, message: 'Payment not valid' };
  }

  const sslcz    = new SSLCommerzPayment(env.SSL_STORE_ID, env.SSL_STORE_PASS, isLive);
  const validated = await sslcz.validate({ val_id });

  if (validated.status !== 'VALID' && validated.status !== 'VALIDATED') {
    await _markFailed(tran_id, 'Validation failed', body);
    return { success: false, message: 'Validation failed' };
  }

  return _markPaid({ tran_id, orderId, gatewayResponse: validated, valId: val_id });
};

export const handleSSLIPN = async (body) => {
  const { tran_id, status, value_a: orderId } = body;
  if (status !== 'VALID' && status !== 'VALIDATED') return;
  await _markPaid({ tran_id, orderId, gatewayResponse: body, ipnPayload: body });
};

export const handleSSLFail = async (body) => {
  const { tran_id } = body;
  await _markFailed(tran_id, 'Payment failed/cancelled by user', body);
};

const _markPaid = async ({ tran_id, orderId, gatewayResponse, ipnPayload, valId }) => {
  const payment = await Payment.findOneAndUpdate(
    { transactionId: tran_id },
    {
      status: 'paid',
      gatewayResponse,
      ...(ipnPayload && { ipnPayload }),
      ...(valId && { gatewayRef: valId }),
      verifiedAt: new Date(),
    },
    { new: true }
  );

  if (payment && orderId) {
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      status:        'confirmed',
    });
  }

  return { success: true, payment };
};

const _markFailed = async (tran_id, reason, body) => {
  await Payment.findOneAndUpdate(
    { transactionId: tran_id },
    { status: 'failed', gatewayResponse: body, note: reason }
  );
};