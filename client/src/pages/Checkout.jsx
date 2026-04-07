import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';

import api from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();

  // Fetch checkout configuration and delivery zones from the API
  const { data: checkoutConfig } = useQuery({
    queryKey: ['checkout-config'],
    queryFn: () => api.get('/checkout-config').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: deliveryZones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => api.get('/delivery').then(r => r.data.data),
  });

  // Dynamic PAYMENT_METHODS from checkoutConfig
  const PAYMENT_METHODS = checkoutConfig?.paymentMethods?.filter(m => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder) || [
    { key: 'cod', label: 'Cash on Delivery', note: 'Pay when your order arrives' },
    { key: 'bkash', label: 'bKash', note: 'bKash mobile banking' },
  ];

  // Dynamic shipping cost based on district
  const getShippingCost = useCallback((district) => {
    if (!district || deliveryZones.length === 0) return 60;
    for (const zone of deliveryZones) {
      if (zone.areas?.some(a => a.toLowerCase() === district.toLowerCase())) return zone.charge;
    }
    return deliveryZones.find(z => z.zone.toLowerCase().includes('outside'))?.charge || 120;
  }, [deliveryZones]);

  const shipping = getShippingCost(form.district);

  // Dynamic fields from checkoutConfig
  const activeFields = checkoutConfig?.fields?.filter(f => f.isActive).sort((a, b) => a.sortOrder - b.sortOrder) || [];

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    district: '',
    zip: '',
    note: '',
    paymentMethod: 'cod',
  });

  const [errors, setErrors] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');

  const incompleteTimerRef = useRef(null);
  const hasSentIncomplete = useRef(false);

  const discount = couponResult?.discount || 0;
  const grandTotal = total + shipping - discount;

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items.length, navigate]);

  const sendIncomplete = () => {
    if (hasSentIncomplete.current) return;
    if (!form.phone || form.phone.length < 10) return;
    hasSentIncomplete.current = true;
    api.post('/orders/incomplete', {
      phone: form.phone,
      email: form.email,
      sessionId: localStorage.getItem('sessionId') || undefined,
      items: items.map((i) => ({ product: i._id, qty: i.qty })),
    }).catch(() => {});
  };

  const handlePhoneBlur = () => {
    if (incompleteTimerRef.current) clearTimeout(incompleteTimerRef.current);
    incompleteTimerRef.current = setTimeout(sendIncomplete, 3000);
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!/^01[3-9]\d{8}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Bangladeshi phone number';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    return e;
  };

  const orderMutation = useMutation({
    mutationFn: (payload) => api.post('/orders', payload),
    onSuccess: (res) => {
      clearCart();
      navigate(`/order-success/${res.data.data.orderNumber}`);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to place order');
    },
  });

  const applyCoupon = async () => {
    setCouponError('');
    try {
      const { data } = await api.post('/offers/validate', { code: couponCode, orderTotal: total });
      setCouponResult(data.data);
    } catch (err) {
      setCouponResult(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const { paymentMethod, ...address } = form;
    orderMutation.mutate({
      items: items.map((i) => ({ product: i._id, qty: i.qty })),
      shippingAddress: address,
      paymentMethod,
      ...(couponResult && { couponCode: couponResult.code }),
    });
  };

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const renderField = (field) => {
    const err = errors[field.name];
    const val = form[field.name] || field.defaultValue || '';
    const onChange = (v) => set(field.name, v);

    if (field.type === 'textarea') return (
      <textarea value={val} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder}
        style={{ ...s.input, height: 72, resize: 'vertical', ...(err && { borderColor: '#ef4444' }) }} />
    );
    if (field.type === 'select') return (
      <select value={val} onChange={(e) => onChange(e.target.value)} style={{ ...s.input, ...(err && { borderColor: '#ef4444' }) }}>
        <option value="">{field.placeholder || 'Select...'}</option>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (field.type === 'radio') return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {field.options?.map(o => (
          <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input type="radio" name={field.name} value={o} checked={val === o} onChange={() => onChange(o)} />
            {o}
          </label>
        ))}
      </div>
    );
    if (field.type === 'checkbox') return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!val} onChange={e => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
    return (
      <input type={field.type} value={val} onChange={e => onChange(e.target.value)} placeholder={field.placeholder}
        onBlur={field.name === 'phone' ? handlePhoneBlur : undefined}
        style={{ ...s.input, ...(err && { borderColor: '#ef4444' }) }} />
    );
  };

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Checkout</h1>
      <form onSubmit={handleSubmit} style={s.layout}>
        <div style={s.formCol}>
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Delivery Information</h2>
            <div style={s.row2}>
              {activeFields.map((field) => (
                <Field key={field.name} label={field.label} error={errors[field.name]}>
                  {renderField(field)}
                </Field>
              ))}
            </div>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>Payment Method</h2>
            <div style={s.paymentGrid}>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.key} style={{ ...s.payCard, ...(form.paymentMethod === m.key && s.payCardActive) }}>
                  <input type="radio" name="payment" value={m.key} checked={form.paymentMethod === m.key}
                    onChange={() => set('paymentMethod', m.key)} style={{ marginRight: 8 }} />
                  {m.label}
                </label>
              ))}
            </div>
          </section>
        </div>

        <div style={s.summaryCol}>
          <div style={s.summaryCard}>
            <h2 style={s.sectionTitle}>Your Order</h2>
            {items.map((item) => (
              <div key={item._id} style={s.orderItem}>
                <img src={item.images?.[0]?.url} alt={item.name} style={s.orderThumb} />
                <div style={{ flex: 1 }}>
                  <p style={s.orderName}>{item.name}</p>
                  <p style={s.orderQty}>Qty: {item.qty}</p>
                </div>
                <span style={s.orderLineTotal}>
                  ৳{((item.discountPrice || item.price) * item.qty).toLocaleString()}
                </span>
              </div>
            ))}

            <div style={s.divider} />
            <div style={s.summaryRow}><span>Subtotal</span><span>৳{total.toLocaleString()}</span></div>
            <div style={s.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: shipping === 0 ? '#38a169' : 'inherit' }}>
                {shipping === 0 ? 'Free' : `৳${shipping}`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #e2e2e2', borderRadius: 6, fontSize: 14 }}
              />
              <button
                type="button"
                onClick={applyCoupon}
                style={{ padding: '8px 14px', background: '#f5f5f5', border: '1px solid #e2e2e2', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
              >
                Apply
              </button>
            </div>
            {couponError && <p style={{ color: '#e53e3e', fontSize: 12, marginBottom: 8 }}>{couponError}</p>}
            {couponResult && <p style={{ color: '#38a169', fontSize: 13, marginBottom: 8 }}>Coupon applied! Saving ৳{couponResult.discount}</p>}

            <div style={{ ...s.summaryRow, ...s.grandTotal }}>
              <span>Total</span><span>৳{grandTotal.toLocaleString()}</span>
            </div>

            <button type="submit" disabled={orderMutation.isPending} style={s.placeBtn}>
              {orderMutation.isPending ? 'Placing Order...' : `Place Order — ৳${grandTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: '#e53e3e', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: 28, fontWeight: 700, marginBottom: 28 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' },
  formCol: {},
  section: { border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 20 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  inputErr: { borderColor: '#e53e3e' },
  paymentGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  payCard: { display: 'flex', alignItems: 'center', border: '1px solid #e2e2e2', borderRadius: 8, padding: '12px 16px', cursor: 'pointer', fontSize: 14 },
  payCardActive: { borderColor: '#1a1a1a', background: '#f9f9f9', fontWeight: 600 },
  summaryCol: {},
  summaryCard: { border: '1px solid #eee', borderRadius: 12, padding: 24, position: 'sticky', top: 20 },
  orderItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  orderThumb: { width: 52, height: 52, objectFit: 'cover', borderRadius: 6, background: '#f5f5f5', flexShrink: 0 },
  orderName: { fontSize: 14, fontWeight: 600, margin: '0 0 2px' },
  orderQty: { fontSize: 12, color: '#888', margin: 0 },
  orderLineTotal: { fontSize: 14, fontWeight: 700, flexShrink: 0 },
  divider: { borderTop: '1px solid #eee', margin: '12px 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 },
  grandTotal: { fontWeight: 700, fontSize: 18, borderTop: '1px solid #eee', paddingTop: 12, marginTop: 4 },
  placeBtn: { width: '100%', padding: 14, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 16 },
};