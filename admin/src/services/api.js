import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

let _accessToken = null;

export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = ()       => _accessToken;

api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;