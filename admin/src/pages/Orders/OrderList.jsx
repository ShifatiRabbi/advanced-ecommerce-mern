import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const STATUSES = [
  { key: '',           label: 'All',            color: '#374151', bg: '#f3f4f6' },
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
    store_id:         parseInt(import.meta.env.VITE_PATHAO_STORE_ID || '0'),
    merchant_order_id:o.orderNumber,
    recipient_name:   o.shippingAddress?.fullName,
    recipient_phone:  o.shippingAddress?.phone,
    recipient_address:o.shippingAddress?.address,
    recipient_city:   1,
    recipient_zone:   1,
    delivery_type:    48,
    item_type:        2,
    special_instruction: o.shippingAddress?.note || '',
    item_quantity:    o.items?.length,
    item_weight:      0.5,
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
    invoice:          o.orderNumber,
    recipient_name:   o.shippingAddress?.fullName,
    recipient_phone:  o.shippingAddress?.phone,
    recipient_address:o.shippingAddress?.address,
    cod_amount:       o.paymentMethod === 'cod' ? o.total : 0,
    note:             o.shippingAddress?.note || '',
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
  const [tab,       setTab]       = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [sort,      setSort]      = useState('-createdAt');
  const [selected,  setSelected]  = useState(new Set());
  const [expanded,  setExpanded]  = useState(null);
  const [courier,   setCourier]   = useState(null);
  const [pushing,   setPushing]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', tab, search, page, sort],
    queryFn:  () => api.get('/orders', { params: { status: tab||undefined, search: search||undefined, page, limit: 20, sort } }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ['order-stats'],
    queryFn:  () => api.get('/orders/stats').then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['order-stats'] }); },
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
    const ok  = results.filter(r => r.ok).length;
    const fail= results.filter(r => !r.ok).length;
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

  const stats = statsData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Orders</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport}
            style={s.actionBtn}>
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

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Orders',  value: stats.total },
            { label: 'Revenue',       value: `৳${(stats.revenue||0).toLocaleString()}` },
            { label: 'Pending',       value: stats.byStatus?.pending?.count || 0 },
            { label: 'Incomplete',    value: stats.byStatus?.incomplete?.count || 0 },
            { label: 'Fake',          value: stats.byStatus?.fake?.count || 0 },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{c.value}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {STATUSES.map(st => (
          <button key={st.key} onClick={() => { setTab(st.key); setPage(1); setSelected(new Set()); }}
            style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${tab === st.key ? '#111827' : '#e5e7eb'}`, background: tab === st.key ? '#111827' : '#fff', color: tab === st.key ? '#fff' : '#374151', cursor: 'pointer', fontSize: 12, fontWeight: tab === st.key ? 700 : 400 }}>
            {st.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by order#, phone, name..." style={s.searchInput} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={s.select}>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-total">Highest total</option>
          <option value="total">Lowest total</option>
          <option value="status">Status A-Z</option>
        </select>
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['confirmed','shipped','delivered','cancelled'].map(st => (
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

      {isLoading ? <p style={{ padding: 20 }}>Loading...</p> : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>
                  <input type="checkbox" checked={selected.size === data?.orders?.length && data?.orders?.length > 0}
                    onChange={toggleAll} />
                </th>
                {['Order #','Date','Customer','Phone','Items','Total','Payment','Status','Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.orders?.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP[''];
                const isOpen = expanded === order._id;
                return (
                  <>
                    <tr key={order._id} style={{ ...s.tr, background: selected.has(order._id) ? '#eff6ff' : '#fff' }}>
                      <td style={s.td}>
                        <input type="checkbox" checked={selected.has(order._id)} onChange={() => toggleSelect(order._id)} />
                      </td>
                      <td style={s.td}>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#111827' }}>
                          {order.orderNumber}
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontSize: 13 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{order.shippingAddress?.fullName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{order.shippingAddress?.city}</div>
                      </td>
                      <td style={s.td}>
                        <button onClick={() => { copyText(order.shippingAddress?.phone || ''); alert('Phone copied!'); }}
                          title="Click to copy phone"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', padding: 0, fontFamily: 'monospace' }}>
                          {order.shippingAddress?.phone}
                        </button>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 13 }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                        {order.items?.slice(0, 1).map((item, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#9ca3af', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                            {order.items?.some(i => i.variant) && <span style={{ marginLeft: 4, fontSize: 10, background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>+variants</span>}
                          </div>
                        ))}
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>৳{order.total?.toLocaleString()}</div>
                        {order.discount > 0 && <div style={{ fontSize: 11, color: '#059669' }}>-৳{order.discount} off</div>}
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: order.paymentStatus === 'paid' ? '#d1fae5' : '#fef9c3', color: order.paymentStatus === 'paid' ? '#065f46' : '#854d0e' }}>
                          {order.paymentMethod?.toUpperCase()}
                        </span>
                      </td>
                      <td style={s.td}>
                        <select value={order.status}
                          onChange={e => statusMutation.mutate({ id: order._id, status: e.target.value })}
                          style={{ padding: '4px 8px', border: `1px solid ${st.bg}`, borderRadius: 6, background: st.bg, color: st.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                          {STATUSES.filter(s => s.key).map(st => (
                            <option key={st.key} value={st.key}>{st.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setExpanded(isOpen ? null : order._id)}
                            title="View details"
                            style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 5, background: isOpen ? '#f3f4f6' : '#fff', cursor: 'pointer', fontSize: 12 }}>
                            {isOpen ? '▲' : '▼'}
                          </button>
                          <button onClick={() => copyOrderDetails(order)}
                            title="Copy order details"
                            style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
                            📋
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr key={`${order._id}-detail`}>
                        <td colSpan={10} style={{ padding: 0, background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                            <div>
                              <p style={s.detailLabel}>Shipping address</p>
                              <p style={s.detailVal}>{order.shippingAddress?.fullName}</p>
                              <p style={s.detailVal}>{order.shippingAddress?.phone}</p>
                              {order.shippingAddress?.email && <p style={s.detailVal}>{order.shippingAddress.email}</p>}
                              <p style={s.detailVal}>{order.shippingAddress?.address}</p>
                              <p style={s.detailVal}>{order.shippingAddress?.city}{order.shippingAddress?.district ? `, ${order.shippingAddress.district}` : ''}</p>
                              {order.shippingAddress?.note && <p style={{ ...s.detailVal, fontStyle: 'italic', color: '#6b7280' }}>Note: {order.shippingAddress.note}</p>}
                            </div>
                            <div>
                              <p style={s.detailLabel}>Items ordered</p>
                              {order.items?.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                                  {item.image && <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                                  <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{item.name}</p>
                                    {item.variant && (
                                      <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px' }}>
                                        {Object.entries(item.variant).map(([k,v]) => `${k}: ${v}`).join(' · ')}
                                      </p>
                                    )}
                                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>×{item.qty} · ৳{item.total?.toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p style={s.detailLabel}>Order summary</p>
                              {[
                                { l: 'Subtotal',   v: `৳${order.subtotal?.toLocaleString()}` },
                                { l: 'Shipping',   v: `৳${order.shippingCharge?.toLocaleString()}` },
                                { l: 'Discount',   v: order.discount > 0 ? `-৳${order.discount?.toLocaleString()}` : '—' },
                                { l: 'Total',      v: `৳${order.total?.toLocaleString()}`, bold: true },
                                { l: 'Payment',    v: `${order.paymentMethod?.toUpperCase()} · ${order.paymentStatus}` },
                                { l: 'Coupon',     v: order.couponCode || '—' },
                              ].map(r => (
                                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #e5e7eb' }}>
                                  <span style={{ color: '#6b7280' }}>{r.l}</span>
                                  <span style={{ fontWeight: r.bold ? 700 : 400 }}>{r.v}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                                <button onClick={() => copyOrderDetails(order)}
                                  style={{ flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
                                  Copy Details
                                </button>
                                <button onClick={async () => {
                                  const r = await pushToPathao([order]);
                                  alert(`Pathao: ${r[0].ok ? 'Success — ' + r[0].ref : 'Failed — ' + r[0].error}`);
                                }} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 6, background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                                  → Pathao
                                </button>
                                <button onClick={async () => {
                                  const r = await pushToSteadfast([order]);
                                  alert(`Steadfast: ${r[0].ok ? 'Success — ' + r[0].ref : 'Failed — ' + r[0].error}`);
                                }} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: 6, background: '#7c3aed', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                                  → Steadfast
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 16, justifyContent: 'center' }}>
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