import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

export const useSSLPayment = () =>
  useMutation({
    mutationFn: (orderId) => api.post('/payment/ssl/init', { orderId }).then(r => r.data.data),
    onSuccess: (data) => {
      window.location.href = data.GatewayPageURL;
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Payment initiation failed');
    },
  });

export const useBkashPayment = () =>
  useMutation({
    mutationFn: (orderId) => api.post('/payment/bkash/create', { orderId }).then(r => r.data.data),
    onSuccess: (data) => {
      window.location.href = data.bkashURL;
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'bKash payment failed');
    },
  });