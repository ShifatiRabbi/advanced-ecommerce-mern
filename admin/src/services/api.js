import axios from 'axios';
import { toast } from '../utils/toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export let _accessToken = null;
export const setAccessToken = (token) => { _accessToken = token; };
export const getAccessToken = ()   => _accessToken;

// Request — attach token + start loader
api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// Response — handle 401 refresh + error toasts
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
    
    // 422 / 400 Validation — let individual callers handle via toast.fromApiError
    // Other errors — show generic toast UNLESS caller sets _silent
    if (!original._silent) {
      const status = err.response?.status;
      if (status >= 500) toast.error('Server error. Please try again.');
      else if (status === 403) toast.error('Access denied.');
      else if (status === 404) toast.error('Resource not found.');
      // 400 / 422 handled by caller via toast.fromApiError(err)
    }
    return Promise.reject(err);
  }
);

export default api;