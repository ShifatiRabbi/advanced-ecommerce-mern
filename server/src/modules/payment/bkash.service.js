import axios  from 'axios';
import { Order }   from '../order/order.model.js';
import { Payment } from './payment.model.js';
import { env }     from '../../config/env.js';

const BASE = env.BKASH_BASE_URL;

let _tokenCache = null;

const getGrantToken = async () => {
  if (_tokenCache && _tokenCache.expiresAt > Date.now()) {
    return _tokenCache.token;
  }

  const { data } = await axios.post(
    `${BASE}/tokenized/checkout/token/grant`,
    { app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET },
    {
      headers: {
        username:     env.BKASH_USERNAME,
        password:     env.BKASH_PASSWORD,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!data?.id_token) throw new Error('bKash token grant failed: ' + JSON.stringify(data));

  _tokenCache = {
    token:     data.id_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return _tokenCache.token;
};

const bkashHeaders = async () => ({
  Authorization:  await getGrantToken(),
  'X-APP-Key':    env.BKASH_APP_KEY,
  'Content-Type': 'application/json',
});

export const createBkashPayment = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
  if (order.paymentStatus === 'paid') {
    const e = new Error('Order already paid'); e.status = 400; throw e;
  }

  const headers = await bkashHeaders();

  const payload = {
    mode:              '0011',
    payerReference:    order.shippingAddress.phone,
    callbackURL:       `${env.BKASH_CALLBACK_URL}?orderId=${orderId}`,
    amount:            String(order.total),
    currency:          'BDT',
    intent:            'sale',
    merchantInvoiceNumber: order.orderNumber,
  };

  let res;
  try {
    const { data } = await axios.post(
      `${BASE}/tokenized/checkout/create`,
      payload,
      { headers }
    );
    res = data;
  } catch (err) {
    if (err.response?.status === 401) {
      _tokenCache = null;
      const freshHeaders = await bkashHeaders();
      const { data } = await axios.post(`${BASE}/tokenized/checkout/create`, payload, { headers: freshHeaders });
      res = data;
    } else throw err;
  }

  if (!res?.bkashURL) {
    throw new Error('bKash createPayment failed: ' + (res?.statusMessage || JSON.stringify(res)));
  }

  await Payment.create({
    order:        order._id,
    method:       'bkash',
    status:       'initiated',
    amount:       order.total,
    transactionId:res.paymentID,
    gatewayRef:   res.paymentID,
    gatewayResponse: res,
  });

  await Order.findByIdAndUpdate(order._id, { paymentMethod: 'bkash' });

  return { bkashURL: res.bkashURL, paymentID: res.paymentID };
};

export const executeBkashPayment = async ({ paymentID, orderId, status }) => {
  if (status === 'cancel' || status === 'failure') {
    await Payment.findOneAndUpdate(
      { transactionId: paymentID },
      { status: 'failed', note: `User ${status}d` }
    );
    return { success: false, message: `Payment ${status}d` };
  }

  const headers = await bkashHeaders();

  let res;
  try {
    const { data } = await axios.post(
      `${BASE}/tokenized/checkout/execute`,
      { paymentID },
      { headers }
    );
    res = data;
  } catch (err) {
    if (err.response?.status === 401) {
      _tokenCache = null;
      const freshHeaders = await bkashHeaders();
      const { data } = await axios.post(`${BASE}/tokenized/checkout/execute`, { paymentID }, { headers: freshHeaders });
      res = data;
    } else throw err;
  }

  if (res?.transactionStatus !== 'Completed') {
    await Payment.findOneAndUpdate(
      { transactionId: paymentID },
      { status: 'failed', gatewayResponse: res, note: res?.statusMessage }
    );
    return { success: false, message: res?.statusMessage || 'Payment not completed' };
  }

  await Payment.findOneAndUpdate(
    { transactionId: paymentID },
    {
      status:           'paid',
      gatewayResponse:  res,
      gatewayRef:       res.trxID,
      verifiedAt:       new Date(),
    }
  );

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    status:        'confirmed',
  });

  return { success: true, trxID: res.trxID, amount: res.amount };
};

export const refundBkashPayment = async (paymentId, amount, reason) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment || payment.method !== 'bkash') {
    const e = new Error('bKash payment not found'); e.status = 404; throw e;
  }

  const headers = await bkashHeaders();

  const { data } = await axios.post(
    `${BASE}/tokenized/checkout/payment/refund`,
    {
      paymentID:  payment.transactionId,
      trxID:      payment.gatewayRef,
      amount:     String(amount || payment.amount),
      currency:   'BDT',
      reason,
    },
    { headers }
  );

  if (data?.statusCode === '0000') {
    await Payment.findByIdAndUpdate(paymentId, {
      status:       'refunded',
      refundedAt:   new Date(),
      refundAmount: amount || payment.amount,
    });
    await Order.findByIdAndUpdate(payment.order._id, { paymentStatus: 'refunded' });
  }

  return data;
};