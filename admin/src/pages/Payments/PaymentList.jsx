import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const METHOD_COLORS = {
  sslcommerz: { bg: '#dbeafe', color: '#1e40af' },
  bkash:      { bg: '#fce7f3', color: '#9d174d' },
  manual:     { bg: '#f3f4f6', color: '#374151' },
  cod:        { bg: '#ecfdf5', color: '#065f46' },
};
const STATUS_COLORS = {
  paid:      { bg: '#dcfce7', color: '#166534' },
  failed:    { bg: '#fee2e2', color: '#991b1b' },
  initiated: { bg: '#fef9c3', color: '#854d0e' },
  refunded:  { bg: '#f3e8ff', color: '#6b21a8' },
};

export default function PaymentList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ orderId: '', transactionId: '', amount: '', note: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn:  () => api.get('/payment', { params: { page, limit: 20 } }).then(r => r.data.data),
  });

  const manualMutation = useMutation({
    mutationFn: (form) => api.post('/payment/manual/confirm', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      setShowManualModal(false);
      setManualForm({ orderId: '', transactionId: '', amount: '', note: '' });
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed'),
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, amount }) => api.post('/payment/bkash/refund', { paymentId, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      alert('Refund initiated');
    },
  });

  return (
    <div className="admin-page-payments-payment-list" id="admin-page-payments-payment-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Payments</h2>
        <button onClick={() => setShowManualModal(true)}
          style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          + Confirm Manual Payment
        </button>
      </div>

      {showManualModal && (
        <div style={{ border: '1px solid #e2e2e2', borderRadius: 12, padding: 24, marginBottom: 24, background: '#fafafa' }}>
          <h3 style={{ margin: '0 0 16px' }}>Confirm Manual Payment</h3>
          {[
            { key: 'orderId',       label: 'Order ID *',       placeholder: 'MongoDB Order _id' },
            { key: 'transactionId', label: 'Transaction ID',   placeholder: 'Bank ref / receipt' },
            { key: 'amount',        label: 'Amount (BDT)',      placeholder: '0' },
            { key: 'note',          label: 'Note',             placeholder: 'e.g. Nagad transfer' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{label}</label>
              <input value={manualForm[key]} onChange={(e) => setManualForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e2e2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => manualMutation.mutate(manualForm)} disabled={manualMutation.isPending}
              style={{ padding: '8px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
              {manualMutation.isPending ? 'Confirming...' : 'Confirm'}
            </button>
            <button onClick={() => setShowManualModal(false)}
              style={{ padding: '8px 20px', border: '1px solid #e2e2e2', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              {['Order', 'Method', 'Amount', 'Status', 'TrxID', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', color: '#555' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.payments?.map((p) => {
              const mc = METHOD_COLORS[p.method] || METHOD_COLORS.cod;
              const sc = STATUS_COLORS[p.status] || { bg: '#f3f4f6', color: '#374151' };
              return (
                <tr key={p._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.order?.orderNumber || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: mc.bg, color: mc.color }}>
                      {p.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', fontWeight: 700 }}>৳{p.amount?.toLocaleString()}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px', fontFamily: 'monospace', fontSize: 12, color: '#666' }}>
                    {p.transactionId?.slice(0, 20) || '—'}
                  </td>
                  <td style={{ padding: '12px 12px', color: '#888', fontSize: 13 }}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    {p.method === 'bkash' && p.status === 'paid' && (
                      <button
                        onClick={() => { if (window.confirm('Refund this bKash payment?')) refundMutation.mutate({ paymentId: p._id, amount: p.amount }); }}
                        style={{ padding: '4px 10px', background: '#fce7f3', color: '#9d174d', border: '1px solid #fbcfe8', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
        {Array.from({ length: data?.pagination?.pages || 1 }, (_, i) => i + 1).map(pg => (
          <button key={pg} onClick={() => setPage(pg)}
            style={{ padding: '6px 12px', border: '1px solid #e2e2e2', borderRadius: 6, background: page === pg ? '#1a1a1a' : 'none', color: page === pg ? '#fff' : 'inherit', cursor: 'pointer', fontSize: 13 }}>
            {pg}
          </button>
        ))}
      </div>
    </div>
  );
}