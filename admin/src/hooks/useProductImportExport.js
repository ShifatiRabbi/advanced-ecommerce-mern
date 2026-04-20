import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from '../utils/toast';

/**
 * Admin product CSV import/export (Shopify template vs WooCommerce / WP-export CSV).
 * Field mapping is handled on the server in productImportExport.service.js.
 */
export function useProductImportExport() {
  const qc = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: async (format) => {
      const res = await api.get('/products/export', {
        params: { format },
        responseType: 'blob',
      });
      return { blob: res.data, format };
    },
    onSuccess: ({ blob, format }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${format}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV download started');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Export failed');
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ format, file }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('format', format);
      const { data } = await api.post('/products/import', fd);
      return data.data;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      const failed = r?.failed?.length || 0;
      toast.success(`Import complete: ${r.created ?? 0} created, ${r.updated ?? 0} updated${failed ? `, ${failed} failed` : ''}`);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Import failed');
    },
  });

  return { exportMutation, importMutation };
}
