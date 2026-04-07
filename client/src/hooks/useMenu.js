import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useMenu = (key = 'header') =>
  useQuery({
    queryKey: ['menu', key],
    queryFn:  () => api.get(`/menus/${key}`).then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });