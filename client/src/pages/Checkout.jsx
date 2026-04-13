import { useState, useEffect, useMemo } from 'react';
import { useNavigate }                       from 'react-router-dom';
import { useQuery, useMutation }             from '@tanstack/react-query';
import api                                   from '../services/api';
import { useCartStore }                      from '../store/cartStore';
import { useAuthStore }                      from '../store/authStore';
import { toast }                             from '../utils/toast';

const DEFAULT_FIELDS = [
  { id:'f1', name:'fullName',  label:'Full Name',     type:'text',     required:true,  isActive:true, width:'half', placeholder:'Your name' },
  { id:'f2', name:'phone',     label:'Phone',         type:'tel',      required:true,  isActive:true, width:'half', placeholder:'01XXXXXXXXX' },
  { id:'f3', name:'email',     label:'Email',         type:'email',    required:false, isActive:true, width:'full', placeholder:'you@email.com' },
  { id:'f4', name:'address',   label:'Full Address',  type:'textarea', required:true,  isActive:true, width:'full', placeholder:'House, Road, Area' },
  { id:'f5', name:'city',      label:'City',          type:'text',     required:true,  isActive:true, width:'half', placeholder:'City' },
  { id:'f6', name:'district',  label:'District',      type:'select',   required:false, isActive:true, width:'half', options:['Dhaka','Chittagong','Rajshahi','Khulna','Sylhet','Barishal','Rangpur','Mymensingh'] },
  { id:'f7', name:'note',      label:'Order Note',    type:'textarea', required:false, isActive:true, width:'full', placeholder:'Special instructions...' },
];

const DEFAULT_PAYMENTS = [
  { key:'cod',   label:'Cash on Delivery', note:'Pay when your order arrives',  isActive:true, icon:'💵' },
  { key:'bkash', label:'bKash',            note:'bKash mobile banking',          isActive:true, icon:'📱' },
];

export default function Checkout() {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const { items, clearCart } = useCartStore();

  const [form,           setForm]    = useState({});
  const [errors,         setErrors]  = useState({});
  const [paymentMethod,  setPayment] = useState('cod');
  const [couponCode,     setCoupon]  = useState('');
  const [couponData,     setCouponData] = useState(null);
  const [couponError,    setCouponError] = useState('');

  // Pre-fill from user profile
  const defaultFormValues = useMemo(() => ({
    fullName: user?.name || '',
    phone:    user?.phone || '',
    email:    user?.email || '',
  }), [user]);

  // Only update form if fields are still empty (pre-fill once)
  useState(() => {
    setForm(prev => ({
      ...defaultFormValues,
      ...prev,
      fullName: prev.fullName || defaultFormValues.fullName,
      phone:    prev.phone    || defaultFormValues.phone,
      email:    prev.email    || defaultFormValues.email,
    }));
  });

  // Load checkout config
  const { data: config } = useQuery({
    queryKey: ['checkout-config'],
    queryFn:  () => api.get('/checkout-config').then(r => r.data.data),
    staleTime: 60_000,
  });

  // Load delivery zones
  const { data: zones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn:  () => api.get('/delivery').then(r => r.data.data),
    staleTime: 60_000,
  });

  const activeFields = useMemo(() => {
    return config?.fields?.filter(f => f.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder) || DEFAULT_FIELDS;
  }, [config]);
  
  // Auto-set first available payment
  const activePayments = useMemo(() => {
    return config?.paymentMethods?.filter(p => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder) || DEFAULT_PAYMENTS;
  }, [config]);

  useEffect(() => {
    if (activePayments.length === 0) return;

    const isCurrentValid = activePayments.some(p => p.key === paymentMethod);

    if (!isCurrentValid) {
      setPayment(activePayments[0].key);
    }
  }, [activePayments, paymentMethod]);

  // Derived totals — ALWAYS computed from cart items, never passed as props
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

  const shipping = useMemo(() => {
  if (!zones.length) return 60;

  const district = (form.district || form.city || '').toLowerCase().trim();
  if (!district) return 60;

  const matched = zones.find(z =>
    z.areas?.some(a => a.toLowerCase().trim() === district)
  );

  return matched?.charge ??
          (zones.find(z => z.zone?.toLowerCase().includes('outside'))?.charge ||
          120);
  }, [zones, form.district, form.city]);

  const discount  = couponData ? (
    couponData.discountType === 'percent'
      ? Math.round(subtotal * couponData.discountValue / 100)
      : couponData.discountValue
  ) : 0;
  const total     = subtotal + shipping - discount;

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  // Validate required fields
  const validate = () => {
    const errs = {};
    activeFields.forEach(field => {
      if (!field.required) return;
      const val = form[field.name];
      if (!val || String(val).trim() === '') {
        errs[field.name] = `${field.label} is required`;
      }
    });
    if (!paymentMethod) errs.paymentMethod = 'Please select a payment method';
    return errs;
  };

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await api.post('/offers/validate', { code: couponCode, orderTotal: subtotal });
      setCouponData(data.data);
      setCouponError('');
      toast.success(`Coupon applied! Saving ৳${data.data.discountType === 'percent' ? Math.round(subtotal * data.data.discountValue / 100) : data.data.discountValue}`);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    }
  };

  // Submit order
  const orderMutation = useMutation({
    mutationFn: (payload) => api.post('/orders', payload),
    onSuccess: (res) => {
      const order = res.data.data;
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${order.orderNumber}`);
    },
    onError: (err) => toast.fromApiError(err),
  });

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop');
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fill in all required fields');
      // Scroll to first error
      const firstErrField = document.getElementById(`field-${Object.keys(errs)[0]}`);
      firstErrField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const payload = {
      items: items.map(item => ({
        product:         item.productId,
        name:            item.name,
        slug:            item.slug,
        image:           item.image,
        qty:             item.qty,
        unitPrice:       item.unitPrice,
        total:           item.lineTotal,
        // Store variant info on order item
        variant:         item.variantSummary || null,
        variantDetails:  item.selectedVariants
                           ? Object.fromEntries(
                               Object.entries(item.selectedVariants).map(([k,v]) => [k, v?.label ?? v])
                             )
                           : null,
      })),
      shippingAddress: { ...form },
      paymentMethod,
      subtotal,
      shippingCharge: shipping,
      discount,
      total,
      couponCode:     couponData?.code || null,
    };

    orderMutation.mutate(payload);
  };

  // Render a single dynamic field
  const renderField = (field) => {
    const val = form[field.name] ?? '';
    const err = errors[field.name];
    const inputStyle = {
      width: '100%', padding: '10px 12px', fontSize: 14, outline: 'none',
      border: `1px solid ${err ? '#ef4444' : '#d1d5db'}`,
      borderRadius: 8, boxSizing: 'border-box', fontFamily: 'inherit',
      background: '#fff',
    };

    let input;
    if (field.type === 'textarea') {
      input = <textarea id={`field-${field.name}`} value={val} onChange={e => set(field.name, e.target.value)}
        placeholder={field.placeholder} rows={3} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />;
    } else if (field.type === 'select') {
      input = (
        <select id={`field-${field.name}`} value={val} onChange={e => set(field.name, e.target.value)} style={inputStyle}>
          <option value="">Select {field.label}</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    } else {
      input = <input id={`field-${field.name}`} type={field.type} value={val}
        onChange={e => set(field.name, e.target.value)} placeholder={field.placeholder}
        style={inputStyle} />;
    }

    return (
      <div key={field.id} style={{ gridColumn: field.width === 'half' ? 'span 1' : 'span 2', marginBottom: 0 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>
          {field.label}{field.required && <span style={{ color: '#dc2626' }}> *</span>}
        </label>
        {input}
        {err && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>⚠ {err}</p>}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ marginBottom: 16, color: '#6b7280' }}>Your cart is empty.</p>
        <button onClick={() => navigate('/shop')}
          style={{ padding: '12px 24px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 28px' }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>

        {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
        <div>
          {/* Shipping info */}
          <div style={CS.card}>
            <h2 style={CS.cardTitle}>Shipping Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {activeFields.map(renderField)}
            </div>
          </div>

          {/* Payment methods */}
          <div style={CS.card}>
            <h2 style={CS.cardTitle}>Payment Method</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activePayments.map(method => (
                <label
                  key={method.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: `${paymentMethod === method.key ? 2 : 1}px solid ${paymentMethod === method.key ? '#2e7d32' : '#e5e7eb'}`,
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                    background: paymentMethod === method.key ? '#f0fdf4' : '#fff',
                    transition: 'border-color .15s',
                  }}>
                  <input
                    type="radio" name="payment"
                    value={method.key}
                    checked={paymentMethod === method.key}
                    onChange={() => setPayment(method.key)}
                    style={{ display: 'none' }} />
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === method.key ? '#2e7d32' : '#d1d5db'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: paymentMethod === method.key ? '#2e7d32' : '#fff', flexShrink: 0,
                  }}>
                    {paymentMethod === method.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontSize: 20 }}>{method.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{method.label}</p>
                    {method.note && <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{method.note}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Order Summary ────────────────────────────────────────── */}
        <div>
          <div style={CS.card}>
            <h2 style={CS.cardTitle}>Your Order ({items.length} item{items.length!==1?'s':''})</h2>

            {/* Item list */}
            {items.map(item => (
              <div key={item.cartKey} style={{ display: 'flex', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', background: '#f5f5f5', flexShrink: 0 }}>
                  {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </p>
                  {item.variantSummary && (
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px' }}>{item.variantSummary}</p>
                  )}
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    ×{item.qty} @ ৳{item.unitPrice.toLocaleString()}
                  </p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  ৳{item.lineTotal.toLocaleString()}
                </span>
              </div>
            ))}

            {/* Coupon */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={couponCode}
                  onChange={e => { setCoupon(e.target.value); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                  placeholder="Coupon code"
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                <button
                  onClick={applyCoupon}
                  style={{ padding: '9px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                  Apply
                </button>
              </div>
              {couponError && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>⚠ {couponError}</p>}
              {couponData && <p style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>✓ Coupon applied!</p>}
            </div>

            {/* Totals */}
            {[
              { label: 'Subtotal',       value: `৳${subtotal.toLocaleString()}` },
              { label: `Shipping (${form.district || form.city || '—'})`, value: `৳${shipping.toLocaleString()}` },
              ...(discount > 0 ? [{ label: `Discount (${couponData?.code})`, value: `-৳${discount.toLocaleString()}`, green: true }] : []),
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
                <span style={{ color: '#6b7280' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: row.green ? '#059669' : '#111' }}>{row.value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, padding: '12px 0', borderTop: '2px solid #e5e7eb', marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: '#2e7d32' }}>৳{total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={orderMutation.isPending}
              style={{
                width: '100%', padding: 16, marginTop: 8,
                background: orderMutation.isPending ? '#9ca3af' : '#2e7d32',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 800, cursor: orderMutation.isPending ? 'not-allowed' : 'pointer',
              }}>
              {orderMutation.isPending ? '⟳ Placing order...' : `Place Order — ৳${total.toLocaleString()}`}
            </button>

            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
              By placing an order, you agree to our Terms & Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CS = {
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 17, fontWeight: 700, margin: '0 0 18px', paddingBottom: 12, borderBottom: '1px solid #f3f4f6' },
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
  heading: { fontSize: 28, fontWeight: 700, marginBottom: 28 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' },
  formCol: {},
  section: { border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 20 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' },
  paymentGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  payCard: { display: 'flex', alignItems: 'center', border: '1px solid #e2e2e2', borderRadius: 8, padding: '12px 16px', cursor: 'pointer', fontSize: 14 },
  payCardActive: { borderColor: '#1a1a1a', background: '#f9f9f9', fontWeight: 600 },
  summaryCol: {},
  summaryCard: { border: '1px solid #eee', borderRadius: 12, padding: 24, position: 'sticky', top: 20 },
  orderItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  orderThumb: { width: 52, height: 52, objectFit: 'cover', borderRadius: 6, background: '#f5f5f5', flexShrink: 0 },
  orderName: { fontSize: 14, fontWeight: 600, margin: '0 0 2px' },
  orderQty: { fontSize: 12, color: '#666', margin: '2px 0' },
  orderLineTotal: { fontSize: 14, fontWeight: 700, flexShrink: 0 },
  divider: { borderTop: '1px solid #eee', margin: '12px 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 },
  grandTotal: { fontWeight: 700, fontSize: 18, borderTop: '1px solid #eee', paddingTop: 12, marginTop: 4 },
  placeBtn: { width: '100%', padding: 14, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 16 },
};