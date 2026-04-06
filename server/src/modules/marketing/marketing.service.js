import { Settings } from '../settings/settings.model.js';

const KEYS = ['ga4MeasurementId', 'gtmId', 'fbPixelId', 'fbAccessToken', 'smsProvider', 'smsApiKey', 'smsSenderId'];

export const getMarketingSettings = async () => {
  const docs = await Settings.find({ key: { $in: KEYS } }).lean();
  return Object.fromEntries(docs.map(d => [d.key, d.value]));
};

export const updateMarketingSettings = async (data) => {
  const ops = Object.entries(data)
    .filter(([k]) => KEYS.includes(k))
    .map(([key, value]) => Settings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true }));
  await Promise.all(ops);
  return getMarketingSettings();
};

export const sendBulkSms = async ({ numbers, message }) => {
  const settings = await getMarketingSettings();
  if (!settings.smsApiKey || !settings.smsSenderId) {
    throw Object.assign(new Error('SMS not configured'), { status: 400 });
  }
  // Green Web SMS BD API — swap with any BD SMS provider
  const axios = (await import('axios')).default;
  const res = await axios.post('http://api.greenweb.com.bd/api.php', null, {
    params: {
      token:   settings.smsApiKey,
      to:      numbers.join(','),
      message,
      type:    'text',
    },
  });
  return res.data;
};

export const sendOrderSms = async (order) => {
  const settings = await getMarketingSettings();
  if (!settings.smsApiKey) return null;
  const msg = `Dear ${order.shippingAddress.fullName}, your order ${order.orderNumber} has been placed. Total: ৳${order.total}. Thank you!`;
  return sendBulkSms({ numbers: [order.shippingAddress.phone], message: msg });
};