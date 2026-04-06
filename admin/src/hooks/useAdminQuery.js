import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useAdminQuery = (key, url, params = {}) =>
  useQuery({
    queryKey: Array.isArray(key) ? key : [key, params],
    queryFn:  () => api.get(url, { params }).then(r => r.data.data),
    staleTime: 1000 * 30,
  });

export const useAdminMutation = (method, urlFn, options = {}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      const url = typeof urlFn === 'function' ? urlFn(data) : urlFn;
      return api[method](url, data).then(r => r.data);
    },
    onSuccess: () => {
      if (options.invalidate) {
        const keys = Array.isArray(options.invalidate) ? options.invalidate : [options.invalidate];
        keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      }
      options.onSuccess?.();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Something went wrong';
      options.onError?.(msg) ?? alert(msg);
    },
  });
};