import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function ProductList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn:  () => api.get('/products', { params: { page, limit: 20 } }).then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Products ({data?.pagination?.total})</h2>
        <a href="/admin/products/add" style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
          + Add Product
        </a>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '10px 12px' }}>Image</th>
            <th style={{ padding: '10px 12px' }}>Name</th>
            <th style={{ padding: '10px 12px' }}>Category</th>
            <th style={{ padding: '10px 12px' }}>Price</th>
            <th style={{ padding: '10px 12px' }}>Stock</th>
            <th style={{ padding: '10px 12px' }}>Status</th>
            <th style={{ padding: '10px 12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.products?.map((p) => (
            <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '10px 12px' }}>
                {p.images?.[0] && <img src={p.images[0].url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />}
              </td>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name}</td>
              <td style={{ padding: '10px 12px', color: '#666' }}>{p.category?.name}</td>
              <td style={{ padding: '10px 12px' }}>
                {p.discountPrice
                  ? <><span style={{ fontWeight: 700 }}>৳{p.discountPrice}</span> <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: 12 }}>৳{p.price}</span></>
                  : `৳${p.price}`}
              </td>
              <td style={{ padding: '10px 12px', color: p.stock === 0 ? '#e53e3e' : '#38a169', fontWeight: 600 }}>{p.stock}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, background: p.isActive ? '#c6f6d5' : '#fed7d7', color: p.isActive ? '#276749' : '#9b2c2c' }}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => deleteMutation.mutate(p._id)} style={{ padding: '4px 10px', background: '#fff0f0', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'center' }}>
        {Array.from({ length: data?.pagination?.pages || 1 }, (_, i) => i + 1).map((pg) => (
          <button key={pg} onClick={() => setPage(pg)} style={{ padding: '6px 12px', border: '1px solid #e2e2e2', borderRadius: 6, background: page === pg ? '#1a1a1a' : 'none', color: page === pg ? '#fff' : 'inherit', cursor: 'pointer' }}>
            {pg}
          </button>
        ))}
      </div>
    </div>
  );
}