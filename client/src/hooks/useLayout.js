import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useLayout = () => {
  return useQuery({
    queryKey: ['layout'],
    queryFn: () => api.get('/settings/layout').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });
};