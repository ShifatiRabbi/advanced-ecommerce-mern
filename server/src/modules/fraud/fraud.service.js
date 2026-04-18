import axios from 'axios';
import { env } from '../../config/env.js';
import { Order } from '../order/order.model.js';

const BD_PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

// Pathao fraud check — uses blacklist endpoint
export const checkPathaoFraud = async (phone, orderNumber) => {
  try {
    const token = await getPathaoToken();
    // Check order history via Pathao merchant API
    const { data } = await axios.get(
      `${env.PATHAO_BASE_URL}/merchant/order-report`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { recipient_phone: phone },
      }
    ).catch(() => ({ data: null }));

    const history = data?.data?.data || [];
    const cancelled = history.filter(o => o.order_status === 'Cancelled').length;
    const total     = history.length;
    const cancelRate= total > 0 ? cancelled / total : 0;

    return {
      source: 'pathao',
      phone,
      totalOrders:  total,
      cancelledOrders: cancelled,
      cancelRate:   Math.round(cancelRate * 100),
      riskLevel:    cancelRate > 0.5 ? 'HIGH' : cancelRate > 0.25 ? 'MEDIUM' : 'LOW',
      raw:          history.slice(0, 5),
    };
  } catch {
    return null;
  }
};

// Steadfast fraud check
export const checkSteadfastFraud = async (phone) => {
  try {
    const { data } = await axios.get(
      `${env.STEADFAST_BASE_URL}/fraud_check`,
      {
        headers: { 'Api-Key': env.STEADFAST_API_KEY, 'Secret-Key': env.STEADFAST_SECRET_KEY },
        params: { phone },
      }
    ).catch((err) => {
      console.log('Steadfast error:', err?.response?.data || err.message);
      return { data: null };
    });

    if (!data) return null;

    // Steadfast returns fraud_check_status: 0=safe, 1=fraud
    const isFraud   = data?.fraud_check_status === 1;
    const riskScore = data?.risk_score || 0;

    return {
      source:    'steadfast',
      phone,
      isFraud,
      riskScore,
      riskLevel: isFraud || riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
      raw:       data,
    };
  } catch {
    return null;
  }
};

// Internal pattern checks
export const internalFraudCheck = (order) => {
  const reasons = [];
  const phone   = order.shippingAddress?.phone?.replace(/\s/g, '');

  if (!BD_PHONE_RE.test(phone))                   reasons.push('Invalid BD phone format');
  if (/^(.)\1{9}$/.test(phone?.slice(-10)))         reasons.push('Repeated digit phone');
  if (/^01234|12345|98765/.test(phone))             reasons.push('Sequential phone pattern');
  if (order.total > 500000)                         reasons.push('Unusually high order total');
  if (order.items?.length > 25)                     reasons.push('Abnormally many items');
  const addr = order.shippingAddress?.address || '';
  if (addr.length < 8)                              reasons.push('Address too short');
  const city = order.shippingAddress?.city?.toLowerCase() || '';
  if (['test','fake','abc','xxx','aaa'].includes(city)) reasons.push('Suspicious city name');

  const score = reasons.length * 25;
  return {
    source:    'internal',
    reasons,
    score:     Math.min(100, score),
    riskLevel: score >= 75 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW',
  };
};

export const checkFraudBD = async (phone) => {
  try {
    const { data } = await axios.post(
      `${env.FRAUDBD_BASE_URL}/api/check`,
      { phone },
      {
        headers: {
          'API-KEY': env.FRAUDBD_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    ).catch((err) => {
      console.log('FraudBD error:', err?.response?.data || err.message);
      return { data: null };
    });

    if (!data) return null;

    // Adjust based on actual API response
    const fraudCount = data?.fraud_count || 0;
    const reportCount = data?.report_count || 0;

    const riskScore = Math.min(100, fraudCount * 20 + reportCount * 10);

    return {
      source: 'fraudbd',
      phone,
      fraudCount,
      reportCount,
      riskScore,
      riskLevel:
        riskScore > 70 ? 'HIGH' :
        riskScore > 40 ? 'MEDIUM' : 'LOW',
      raw: data,
    };
  } catch {
    return null;
  }
};

// Combined fraud report
export const getFraudReport = async (orderId) => {
  const order = await Order.findById(orderId).lean();
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });

  const phone = order.shippingAddress?.phone;

  const [
    pathaoResult,
    steadfastResult,
    fraudbdResult
  ] = await Promise.all([
    checkPathaoFraud(phone, order.orderNumber),
    checkSteadfastFraud(phone),
    checkFraudBD(phone), // ✅ NEW
  ]);

  const internalResult = internalFraudCheck(order);

  const results = [
    internalResult,
    pathaoResult,
    steadfastResult,
    fraudbdResult, // ✅ include here
  ].filter(Boolean);

  // Smarter risk aggregation (weighted)
  let riskScore = 0;

  results.forEach(r => {
    if (r.riskLevel === 'HIGH') riskScore += 50;
    else if (r.riskLevel === 'MEDIUM') riskScore += 25;
    else riskScore += 10;
  });

  const overallRisk =
    riskScore >= 100 ? 'HIGH' :
    riskScore >= 50  ? 'MEDIUM' : 'LOW';

  const report = {
    orderId,
    phone,
    overallRisk,
    score: riskScore,
    checks: results,
    checkedAt: new Date(),
  };

  // Auto-mark as fake if HIGH risk
  if (overallRisk === 'HIGH' && !order.isFake) {
    await Order.findByIdAndUpdate(orderId, {
      isFake: true,
      fakeReason: results
        .map(r =>
          r.reasons
            ? r.reasons.join(', ')
            : `${r.source}:${r.riskLevel}`
        )
        .join('; '),
      status: 'fake',
    });
  }

  return report;
};

// Helper to get Pathao token (reuse from courier service)
import { pathaoCreateOrder as _unused } from '../courier/courier.service.js';
const getPathaoToken = async () => {
  const { data } = await axios.post(
    `${env.PATHAO_BASE_URL}/issue-token`,
    { client_id: env.PATHAO_CLIENT_ID, client_secret: env.PATHAO_CLIENT_SECRET, username: env.PATHAO_USERNAME, password: env.PATHAO_PASSWORD, grant_type: 'password' }
  );
  return data.access_token;
};