import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api   from '../../services/api';
import { toast } from '../../utils/toast';

export default function ContactMessages() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [replyText, setReply]   = useState('');
  const [page, setPage]         = useState(1);
  const [unreadOnly, setUnread] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['contact-msgs', page, unreadOnly],
    queryFn:  () => api.get('/contact', { params: { page, limit: 20, unreadOnly } }).then(r => r.data.data),
  });

  const readMutation = useMutation({
    mutationFn: (id) => api.patch(`/contact/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-msgs'] }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }) => api.post(`/contact/${id}/reply`, { reply }),
    onSuccess: () => {
      toast.success('Reply sent!');
      qc.invalidateQueries({ queryKey: ['contact-msgs'] });
      setSelected(null); setReply('');
    },
    onError: (err) => toast.fromApiError(err),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contact/${id}`),
    onSuccess: () => { toast.success('Message deleted'); qc.invalidateQueries({ queryKey: ['contact-msgs'] }); setSelected(null); },
    onError: (err) => toast.fromApiError(err),
  });

  const openMsg = (msg) => {
    setSelected(msg);
    setReply('');
    if (!msg.isRead) readMutation.mutate(msg._id);
  };

  const unread = data?.messages?.filter(m => !m.isRead).length || 0;

  return (
    <div className="admin-page-contact-messages-contact-messages" id="admin-page-contact-messages-contact-messages">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Contact Messages</h2>
          {unread > 0 && <span style={{ fontSize: 13, background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{unread} unread</span>}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={unreadOnly} onChange={e => setUnread(e.target.checked)} />
          Unread only
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Message list */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {isLoading ? (
            <p style={{ padding: 24, color: '#9ca3af' }}>Loading...</p>
          ) : data?.messages?.length === 0 ? (
            <p style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No messages yet.</p>
          ) : (
            data.messages.map(msg => (
              <div
                key={msg._id}
                onClick={() => openMsg(msg)}
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  background: selected?._id === msg._id ? '#eff6ff' : msg.isRead ? '#fff' : '#fefce8',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: msg.isRead ? 500 : 700, fontSize: 14 }}>{msg.name}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.email}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {msg.message}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {!msg.isRead    && <span style={{ fontSize: 10, fontWeight: 700, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: 10 }}>UNREAD</span>}
                    {msg.isReplied  && <span style={{ fontSize: 10, fontWeight: 700, background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: 10 }}>REPLIED</span>}
                  </div>
                </div>
              </div>
            ))
          )}
          {data?.pagination?.pages > 1 && (
            <div style={{ display: 'flex', gap: 6, padding: 12, justifyContent: 'center' }}>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => setPage(pg)}
                  style={{ width: 32, height: 32, border: '1px solid #e5e7eb', borderRadius: 6, background: page === pg ? '#111827' : '#fff', color: page === pg ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
                  {pg}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message detail */}
        {selected && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Message Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {[
              { label: 'From',    value: selected.name },
              { label: 'Email',   value: selected.email },
              { label: 'Phone',   value: selected.phone || '—' },
              { label: 'Date',    value: new Date(selected.createdAt).toLocaleString() },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 14 }}>
                <span style={{ fontWeight: 700, color: '#374151', width: 50, flexShrink: 0 }}>{r.label}:</span>
                <span style={{ color: '#555' }}>{r.value}</span>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f9fafb', borderRadius: 8, fontSize: 14, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap', marginBottom: 20 }}>
              {selected.message}
            </div>

            {selected.reply && (
              <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 14, marginBottom: 20, border: '1px solid #bfdbfe' }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#1d4ed8', marginBottom: 6 }}>Your reply ({new Date(selected.repliedAt).toLocaleDateString()}):</p>
                <p style={{ margin: 0, color: '#374151' }}>{selected.reply}</p>
              </div>
            )}

            {!selected.isReplied && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>Reply</label>
                <textarea value={replyText} onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10 }} />
                <button onClick={() => { if (!replyText.trim()) return toast.error('Reply cannot be empty'); replyMutation.mutate({ id: selected._id, reply: replyText }); }}
                  disabled={replyMutation.isPending}
                  style={{ width: '100%', padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            )}

            <button onClick={() => window.confirm('Delete this message?') && deleteMutation.mutate(selected._id)}
              style={{ width: '100%', marginTop: 10, padding: '9px', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>
              Delete Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}