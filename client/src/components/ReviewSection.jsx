import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

function StarPicker({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{ fontSize: size, cursor: 'pointer', color: s <= (hover || value) ? '#f59e0b' : '#d1d5db', transition: 'color .1s' }}>
          ★
        </span>
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 13, width: 40, flexShrink: 0 }}>{star} ★</span>
      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: '#9ca3af', width: 28, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  );
}

export default function ReviewSection({ product }) {
  const { user }   = useAuthStore();
  const qc         = useQueryClient();
  const [rating,   setRating]   = useState(0);
  const [title,    setTitle]    = useState('');
  const [comment,  setComment]  = useState('');
  const [page,     setPage]     = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['reviews', product._id, page],
    queryFn:  () => api.get(`/reviews/product/${product._id}?page=${page}&limit=5`).then(r => r.data.data),
    enabled:  !!product._id,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => api.post('/reviews', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', product._id] });
      setRating(0); setTitle(''); setComment(''); setShowForm(false);
    },
    onError: (err) => alert(err.response?.data?.message || 'Could not submit review'),
  });

  const helpfulMutation = useMutation({
    mutationFn: (id) => api.post(`/reviews/${id}/helpful`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', product._id] }),
  });

  const handleSubmit = () => {
    if (!rating)          return alert('Please select a star rating');
    if (!comment.trim())  return alert('Please write a comment');
    submitMutation.mutate({ productId: product._id, rating, title, comment });
  };

  const reviews  = data?.reviews || [];
  const total    = data?.pagination?.total || 0;
  const pages    = data?.pagination?.pages || 1;
  const avg      = product.ratings?.average || 0;
  const count    = product.ratings?.count   || 0;

  // Build star distribution from reviews
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });

  return (
    <section style={rs.section}>
      <h2 style={rs.sectionTitle}>Customer Reviews</h2>

      {/* ── Summary ── */}
      <div style={rs.summaryRow}>
        <div style={rs.avgBlock}>
          <span style={rs.avgNum}>{avg.toFixed(1)}</span>
          <div style={{ fontSize: 28, color: '#f59e0b', letterSpacing: 2 }}>
            {'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}
          </div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Based on {count} reviews</span>
        </div>
        <div style={rs.distBlock}>
          {[5,4,3,2,1].map(s => (
            <RatingBar key={s} star={s} count={dist[s] || 0} total={reviews.length} />
          ))}
        </div>
        <div>
          {user ? (
            <button onClick={() => setShowForm(v => !v)} style={rs.writeBtn}>
              {showForm ? 'Cancel' : '✏️ Write a Review'}
            </button>
          ) : (
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              <a href="/login" style={{ color: '#2e7d32', fontWeight: 600 }}>Sign in</a> to write a review
            </p>
          )}
        </div>
      </div>

      {/* ── Write review form ── */}
      {showForm && (
        <div style={rs.formCard}>
          <h3 style={rs.formTitle}>Your Review</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={rs.label}>Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={rs.label}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Summary of your experience" style={rs.input} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={rs.label}>Comment *</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product..." rows={4}
              style={{ ...rs.input, height: 100, resize: 'vertical' }} />
          </div>
          <button onClick={handleSubmit} disabled={submitMutation.isPending} style={rs.submitBtn}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {/* ── Reviews list ── */}
      {reviews.length === 0 && !showForm && (
        <p style={{ color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>No reviews yet. Be the first!</p>
      )}

      {reviews.map(review => (
        <div key={review._id} style={rs.reviewCard}>
          <div style={rs.reviewHeader}>
            <div style={rs.avatar}>{review.user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{review.user?.name || 'Customer'}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 16, color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {new Date(review.createdAt).toLocaleDateString('en-BD', { day:'numeric', month:'short', year:'numeric' })}
                </span>
                <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                  Verified
                </span>
              </div>
            </div>
          </div>
          {review.title && <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 6px', color: '#111' }}>{review.title}</p>}
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 10px' }}>{review.comment}</p>
          <button onClick={() => helpfulMutation.mutate(review._id)}
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#6b7280' }}>
            👍 Helpful ({review.helpfulCount || 0})
          </button>
        </div>
      ))}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(pg => (
            <button key={pg} onClick={() => setPage(pg)}
              style={{ width: 34, height: 34, border: '1px solid #e5e7eb', borderRadius: 6, background: page === pg ? '#2e7d32' : '#fff', color: page === pg ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
              {pg}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

const rs = {
  section:      { marginBottom: 48 },
  sectionTitle: { fontSize: 18, fontWeight: 800, margin: '0 0 20px', paddingBottom: 10, borderBottom: '2px solid #e5e7eb' },
  summaryRow:   { display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 32, marginBottom: 28, alignItems: 'start' },
  avgBlock:     { textAlign: 'center' },
  avgNum:       { display: 'block', fontSize: 56, fontWeight: 900, lineHeight: 1, color: '#111', marginBottom: 4 },
  distBlock:    { padding: '4px 0' },
  writeBtn:     { padding: '10px 20px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' },
  formCard:     { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 24 },
  formTitle:    { fontSize: 16, fontWeight: 700, margin: '0 0 16px' },
  label:        { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  input:        { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  submitBtn:    { padding: '10px 24px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  reviewCard:   { border: '1px solid #f3f4f6', borderRadius: 10, padding: '16px 18px', marginBottom: 12, background: '#fff' },
  reviewHeader: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  avatar:       { width: 40, height: 40, borderRadius: '50%', background: '#2e7d32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
};