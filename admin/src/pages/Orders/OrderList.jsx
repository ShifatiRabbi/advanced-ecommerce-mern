import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { OrderRowSkeleton } from '../../components/Skeleton';

const STATUSES = [
  { key: '',         label: 'All',             color: '#374151', bg: '#f3f4f6' },
  { key: 'pending',    label: 'Pending',         color: '#854d0e', bg: '#fef9c3' },
  { key: 'confirmed',  label: 'Confirmed',       color: '#1e40af', bg: '#dbeafe' },
  { key: 'paid',       label: 'Paid',            color: '#065f46', bg: '#d1fae5' },
  { key: 'processing', label: 'Processing',      color: '#5b21b6', bg: '#ede9fe' },
  { key: 'shipped',    label: 'Shipped',          color: '#0369a1', bg: '#e0f2fe' },
  { key: 'ready',      label: 'Ready to Deliver', color: '#92400e', bg: '#fef3c7' },
  { key: 'delivered',  label: 'Completed',        color: '#166534', bg: '#dcfce7' },
  { key: 'returned',   label: 'Returned',         color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'cancelled',  label: 'Cancelled',        color: '#991b1b', bg: '#fee2e2' },
  { key: 'incomplete', label: 'Incomplete',       color: '#4b5563', bg: '#f3f4f6' },
  { key: 'fake',       label: 'Fake',             color: '#9d174d', bg: '#fce7f3' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

const copyText = (text) => {
  navigator.clipboard?.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand('copy'); document.body.removeChild(el);
  });
};

const exportCSV = (orders) => {
  const header = ['Order #','Date','Customer','Phone','Email','City','Items','Subtotal','Shipping','Total','Payment','Status'];
  const rows = orders.map(o => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString(),
    o.shippingAddress?.fullName,
    o.shippingAddress?.phone,
    o.shippingAddress?.email || '',
    o.shippingAddress?.city,
    o.items?.length,
    o.subtotal,
    o.shippingCharge,
    o.total,
    o.paymentMethod,
    o.status,
  ]);
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

const pushToPathao = async (orders) => {
  const payloads = orders.map(o => ({
    store_id: parseInt(import.meta.env.VITE_PATHAO_STORE_ID || '0'),
    merchant_order_id: o.orderNumber,
    recipient_name: o.shippingAddress?.fullName,
    recipient_phone: o.shippingAddress?.phone,
    recipient_address: o.shippingAddress?.address,
    recipient_city: 1,
    recipient_zone: 1,
    delivery_type: 48,
    item_type: 2,
    special_instruction: o.shippingAddress?.note || '',
    item_quantity: o.items?.length,
    item_weight: 0.5,
    amount_to_collect: o.paymentMethod === 'cod' ? o.total : 0,
    item_description: o.items?.map(i => i.name).join(', '),
  }));
  const results = [];
  for (const p of payloads) {
    try {
      const { data } = await api.post('/courier/pathao/create', p);
      results.push({ ok: true, ref: data?.data?.consignment_id });
    } catch (err) {
      results.push({ ok: false, error: err.response?.data?.message });
    }
  }
  return results;
};

const pushToSteadfast = async (orders) => {
  const payloads = orders.map(o => ({
    invoice: o.orderNumber,
    recipient_name: o.shippingAddress?.fullName,
    recipient_phone: o.shippingAddress?.phone,
    recipient_address: o.shippingAddress?.address,
    cod_amount: o.paymentMethod === 'cod' ? o.total : 0,
    note: o.shippingAddress?.note || '',
  }));
  const results = [];
  for (const p of payloads) {
    try {
      const { data } = await api.post('/courier/steadfast/create', p);
      results.push({ ok: true, ref: data?.data?.tracking_code });
    } catch (err) {
      results.push({ ok: false, error: err.response?.data?.message });
    }
  }
  return results;
};

export default function OrderList() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('-createdAt');
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [pushing, setPushing] = useState(false);

  // Fraud Logic States
  const [fraudReports, setFraudReports] = useState({});
  const [fraudLoading, setFraudLoading] = useState({});

  const checkFraud = async (orderId) => {
    setFraudLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const { data } = await api.get(`/fraud/${orderId}`);
      setFraudReports(prev => ({ ...prev, [orderId]: data.data }));
    } catch (err) {
      alert('Fraud check failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setFraudLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', tab, search, page, sort],
    queryFn: () => api.get('/orders', { params: { status: tab||undefined, search: search||undefined, page, limit: 20, sort } }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ['order-stats'],
    queryFn: () => api.get('/orders/stats').then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['order-stats'] }); },
  });

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === data?.orders?.length) setSelected(new Set());
    else setSelected(new Set(data?.orders?.map(o => o._id)));
  };

  const selectedOrders = data?.orders?.filter(o => selected.has(o._id)) || [];

  const handleExport = () => {
    const toExport = selectedOrders.length ? selectedOrders : (data?.orders || []);
    exportCSV(toExport);
  };

  const handleCourier = async (service) => {
    const toSend = selectedOrders.length ? selectedOrders : (data?.orders?.filter(o => o.status === 'confirmed') || []);
    if (!toSend.length) return alert('No orders selected / no confirmed orders');
    setPushing(true);
    const results = service === 'pathao' ? await pushToPathao(toSend) : await pushToSteadfast(toSend);
    setPushing(false);
    const ok = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;
    alert(`${service}: ${ok} created, ${fail} failed`);
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  const copyOrderDetails = (o) => {
    const txt = [
      `Order: ${o.orderNumber}`,
      `Name: ${o.shippingAddress?.fullName}`,
      `Phone: ${o.shippingAddress?.phone}`,
      `Address: ${o.shippingAddress?.address}, ${o.shippingAddress?.city}`,
      `Total: ৳${o.total}`,
      `Payment: ${o.paymentMethod?.toUpperCase()}`,
      `Status: ${o.status}`,
    ].join('\n');
    copyText(txt);
    alert('Order details copied!');
  };

  return (
    <div>
      {/* Header & Main Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Orders</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={s.actionBtn}>
            Export CSV {selected.size > 0 && `(${selected.size})`}
          </button>
          <button onClick={() => handleCourier('pathao')} disabled={pushing}
            style={{ ...s.actionBtn, background: '#059669', color: '#fff', border: 'none' }}>
            {pushing ? '...' : 'Pathao'}
          </button>
          <button onClick={() => handleCourier('steadfast')} disabled={pushing}
            style={{ ...s.actionBtn, background: '#7c3aed', color: '#fff', border: 'none' }}>
            {pushing ? '...' : 'Steadfast'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Orders', value: statsData.total },
            { label: 'Revenue', value: `৳${(statsData.revenue || 0).toLocaleString()}` },
            { label: 'Pending', value: statsData.byStatus?.pending?.count || 0 },
            { label: 'Incomplete', value: statsData.byStatus?.incomplete?.count || 0 },
            { label: 'Fake', value: statsData.byStatus?.fake?.count || 0 },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{c.value}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {STATUSES.map(st => (
          <button key={st.key} onClick={() => { setTab(st.key); setPage(1); setSelected(new Set()); }}
            style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${tab === st.key ? '#111827' : '#e5e7eb'}`, background: tab === st.key ? '#111827' : '#fff', color: tab === st.key ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: tab === st.key ? 700 : 400 }}>
            {st.label}
          </button>
        ))}
      </div>

      {/* Search, Sort, and Bulk Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order#, phone, name..." style={s.searchInput} />
        
        <select value={sort} onChange={e => setSort(e.target.value)} style={s.select}>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-total">Highest total</option>
          <option value="total">Lowest total</option>
        </select>

        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['confirmed', 'shipped', 'delivered', 'cancelled'].map(st => (
              <button key={st} onClick={async () => {
                for (const id of selected) { await statusMutation.mutateAsync({ id, status: st }); }
                setSelected(new Set());
              }} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                Mark {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>
                <input 
                  type="checkbox" 
                  checked={selected.size === data?.orders?.length && data?.orders?.length > 0} 
                  onChange={toggleAll} 
                />
              </th>
              {['Order #', 'Date', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Fraud', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              /* Render 8 skeleton rows to fill the table while loading */
              Array.from({ length: 8 }).map((_, i) => (
                <OrderRowSkeleton key={i} />
              ))
            ) : (
              data?.orders?.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP[''];
                const isOpen = expanded === order._id;
                const fraud = fraudReports[order._id];
                
                return (
                  <React.Fragment key={order._id}>
                    <tr style={{ ...s.tr, background: selected.has(order._id) ? '#eff6ff' : '#fff' }}>
                      <td style={s.td}>
                        <input type="checkbox" checked={selected.has(order._id)} onChange={() => toggleSelect(order._id)} />
                      </td>
                      <td style={s.td}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.orderNumber}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: 13 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600 }}>{order.shippingAddress?.fullName}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{order.shippingAddress?.city}</div>
                      </td>
                      <td style={s.td}>
                        <button 
                          onClick={() => { copyText(order.shippingAddress?.phone || ''); alert('Phone copied!'); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', padding: 0 }}
                        >
                          {order.shippingAddress?.phone}
                        </button>
                      </td>
                      <td style={s.td}>{order.items?.length} items</td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 700 }}>৳{order.total?.toLocaleString()}</div>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: order.paymentStatus === 'paid' ? '#d1fae5' : '#fef9c3' }}>
                          {order.paymentMethod?.toUpperCase()}
                        </span>
                      </td>
                      <td style={s.td}>
                        <select 
                          value={order.status} 
                          onChange={e => statusMutation.mutate({ id: order._id, status: e.target.value })}
                          style={{ padding: '4px 8px', borderRadius: 6, background: st.bg, color: st.color, border: 'none', fontSize: 12, fontWeight: 600 }}
                        >
                          {STATUSES.filter(s => s.key).map(st => (
                            <option key={st.key} value={st.key}>{st.label}</option>
                          ))}
                        </select>
                      </td>

                      <td style={s.td}>
                        {fraud ? (
                          <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: fraud.overallRisk === 'HIGH' ? '#fee2e2' : '#d1fae5', color: fraud.overallRisk === 'HIGH' ? '#991b1b' : '#065f46' }}>
                            {fraud.overallRisk}
                          </span>
                        ) : (
                          <button 
                            onClick={() => checkFraud(order._id)} 
                            disabled={fraudLoading[order._id]} 
                            style={{ padding: '3px 8px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 11 }}
                          >
                            {fraudLoading[order._id] ? '...' : 'Check'}
                          </button>
                        )}
                      </td>

                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setExpanded(isOpen ? null : order._id)} style={s.iconBtn}>
                            {isOpen ? '▲' : '▼'}
                          </button>
                          <button onClick={() => copyOrderDetails(order)} style={s.iconBtn}>📋</button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={11} style={{ padding: 0, background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <div style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30 }}>
                              <div>
                                <p style={s.detailLabel}>Shipping Details</p>
                                <p style={s.detailVal}><strong>{order.shippingAddress?.fullName}</strong></p>
                                <p style={s.detailVal}>{order.shippingAddress?.phone}</p>
                                <p style={s.detailVal}>{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                                {order.shippingAddress?.note && <p style={{ ...s.detailVal, color: '#ef4444' }}>Note: {order.shippingAddress.note}</p>}
                              </div>
                              <div>
                                <p style={s.detailLabel}>Items</p>
                                {order.items?.map((item, i) => (
                                  <div key={i} style={{ marginBottom: 8 }}>
                                    <p style={{ ...s.detailVal, fontWeight: 600 }}>{item.name} × {item.qty}</p>
                                    <p style={{ fontSize: 11, color: '#6b7280' }}>৳{item.price} per unit</p>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p style={s.detailLabel}>Summary</p>
                                <div style={s.summaryRow}><span>Subtotal</span><span>৳{order.subtotal}</span></div>
                                <div style={s.summaryRow}><span>Shipping</span><span>৳{order.shippingCharge}</span></div>
                                <div style={{ ...s.summaryRow, fontWeight: 700, borderTop: '1px solid #e5e7eb', marginTop: 5, paddingTop: 5 }}>
                                  <span>Total</span><span>৳{order.total}</span>
                                </div>
                              </div>
                            </div>

                            {fraud && (
                              <div style={{ marginTop: 20, background: '#fff', padding: 15, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                                <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Fraud Report: {fraud.overallRisk} Risk</h4>
                                {fraud.checks.map((c, i) => (
                                  <div key={i} style={{ fontSize: 12, marginBottom: 5 }}>
                                    <span style={{ fontWeight: 700 }}>[{c.source}]</span> {c.riskLevel}: {c.reasons.join(', ')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
        
        {!isLoading && data?.orders?.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No orders found.</div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16, justifyContent: 'center' }}>
        {Array.from({ length: data?.pagination?.pages || 1 }, (_, i) => i + 1).map(pg => (
          <button key={pg} onClick={() => setPage(pg)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: 6, 
              border: '1px solid #e5e7eb', 
              background: page === pg ? '#111827' : '#fff', 
              color: page === pg ? '#fff' : '#374151',
              cursor: 'pointer' 
            }}>
            {pg}
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  thead:        { background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' },
  th:           { padding: '10px 12px', fontWeight: 600, color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' },
  tr:           { borderBottom: '1px solid #f3f4f6' },
  td:           { padding: '10px 12px', verticalAlign: 'middle' },
  detailLabel:  { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' },
  detailVal:    { fontSize: 13, margin: '0 0 3px', color: '#374151' },
  actionBtn:    { padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  searchInput:  { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: 260, outline: 'none' },
  select:       { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 },
  pageBtn:      { padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 },
  pageBtnActive:{ background: '#111827', color: '#fff', borderColor: '#111827' },
};