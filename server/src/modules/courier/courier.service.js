import axios    from 'axios';
import { env }  from '../../config/env.js';

const pathaoClient = axios.create({ baseURL: env.PATHAO_BASE_URL || 'https://courier.pathao.com/aladdin/api/v1' });
const sfClient     = axios.create({ baseURL: env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/public/api/v1' });

let pathaoToken = null;

const getPathaoToken = async () => {
  if (pathaoToken) return pathaoToken;
  const { data } = await pathaoClient.post('/issue-token', {
    client_id:     env.PATHAO_CLIENT_ID,
    client_secret: env.PATHAO_CLIENT_SECRET,
    username:      env.PATHAO_USERNAME,
    password:      env.PATHAO_PASSWORD,
    grant_type:    'password',
  });
  pathaoToken = data.access_token;
  setTimeout(() => { pathaoToken = null; }, 55 * 60 * 1000);
  return pathaoToken;
};

export const pathaoCreateOrder = async (payload) => {
  const token = await getPathaoToken();
  const { data } = await pathaoClient.post('/orders', payload, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return data;
};

export const steadfastCreateOrder = async (payload) => {
  const { data } = await sfClient.post('/create_order', payload, {
    headers: { 'Api-Key': env.STEADFAST_API_KEY, 'Secret-Key': env.STEADFAST_SECRET_KEY, 'Content-Type': 'application/json' },
  });
  return data;
};

export const pathaoTracking = async (consignmentId) => {
  const token = await getPathaoToken();
  const { data } = await pathaoClient.get(`/orders/${consignmentId}/info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const steadfastTracking = async (invoiceId) => {
  const { data } = await sfClient.get(`/status_by_invoice/${invoiceId}`, {
    headers: { 'Api-Key': env.STEADFAST_API_KEY, 'Secret-Key': env.STEADFAST_SECRET_KEY },
  });
  return data;
};