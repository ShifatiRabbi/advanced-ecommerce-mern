import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const getDefaultVariantAdj = (product) => {
  if (!product?.variants?.length) return 0;
  return product.variants.reduce((sum, variant) => {
    const options = variant.options || [];
    const idx = variant.defaultOptionIndex ?? 0;
    const opt = options[idx] || options[0];
    return sum + (opt?.priceModifier ?? 0);
  }, 0);
};

const getDisplayPrice = (product) => {
  const variantAdj = getDefaultVariantAdj(product);
  const regularPrice = (product.basePrice ?? product.price ?? 0) + variantAdj;
  const salePrice = (product.discountPrice !== null && product.discountPrice !== undefined)
    ? (product.discountPrice + variantAdj)
    : null;
  return { regularPrice, salePrice };
};

export default function ProductList() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn:  () => api.get('/products', { params: { page, limit: 20, search: search || undefined } }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/products/${id}`, { isActive: !isActive }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <div className="admin-page-products-product-list" id="admin-page-products-product-list">
      <div style={s.topRow}>
        <h2 style={s.heading}>Products {data?.pagination?.total ? `(${data.pagination.total})` : ''}</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..." style={s.searchInput} />
          <button onClick={() => navigate('/products/add')} style={s.addBtn}>+ Add Product</button>
        </div>
      </div>

      {isLoading ? <p style={{ padding: 20 }}>Loading...</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.products?.map(p => (
                (() => {
                  const { regularPrice, salePrice } = getDisplayPrice(p);
                  return (
                <tr key={p._id} style={s.tr}>
                  <td style={{ ...s.td, width: 60 }}>
                    {p.images?.[0]
                      ? <img src={p.images[0].url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                      : <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 6 }} />}
                  </td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{p.sku || ''}</div>
                  </td>
                  <td style={{ ...s.td, color: '#6b7280' }}>{p.category?.name || '—'}</td>
                  <td style={s.td}>
                    {salePrice !== null
                      ? <><span style={{ fontWeight: 700 }}>৳{salePrice.toLocaleString()}</span>{' '}
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: 12 }}>৳{regularPrice.toLocaleString()}</span></>
                      : <span style={{ fontWeight: 700 }}>৳{regularPrice.toLocaleString()}</span>}
                  </td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: p.stock === 0 ? '#dc2626' : p.stock < 10 ? '#d97706' : '#059669' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.pill, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => navigate(`/products/edit/${p._id}`)} style={s.editBtn}>Edit</button>
                      <button onClick={() => toggleActiveMutation.mutate({ id: p._id, isActive: p.isActive })} style={s.toggleBtn}>
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => window.confirm(`Delete "${p.name}"?`) && deleteMutation.mutate(p._id)} style={s.deleteBtn}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={s.pagination}>
        {Array.from({ length: data?.pagination?.pages || 1 }, (_, i) => i + 1).map(pg => (
          <button key={pg} onClick={() => setPage(pg)}
            style={{ ...s.pageBtn, ...(page === pg && s.pageBtnActive) }}>
            {pg}
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  topRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading:     { fontSize: 20, fontWeight: 700, margin: 0 },
  searchInput: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 240, outline: 'none' },
  addBtn:      { padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  tableWrap:   { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead:       { borderBottom: '2px solid #f3f4f6', textAlign: 'left', background: '#f9fafb' },
  th:          { padding: '12px 14px', fontWeight: 600, color: '#6b7280', fontSize: 13 },
  tr:          { borderBottom: '1px solid #f3f4f6' },
  td:          { padding: '12px 14px', verticalAlign: 'middle' },
  pill:        { padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  editBtn:     { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  toggleBtn:   { padding: '4px 10px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  deleteBtn:   { padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  pagination:  { display: 'flex', gap: 6, marginTop: 16, justifyContent: 'center' },
  pageBtn:     { padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 },
  pageBtnActive:{ background: '#111827', color: '#fff', borderColor: '#111827' },
};