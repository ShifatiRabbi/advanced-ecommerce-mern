import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function MarqueeBar({ position = 'below-header', productId, categoryId, page }) {
  const params = { position };
  if (productId)  params.productId  = productId;
  if (categoryId) params.categoryId = categoryId;
  if (page)       params.page       = page;

  const { data: marquees = [] } = useQuery({
    queryKey: ['marquees', position, productId, categoryId, page],
    queryFn:  () => api.get('/marquees', { params }).then(r => r.data.data),
    staleTime: 1000 * 60 * 2,
  });

  if (!marquees.length) return null;

  return (
    <>
      {marquees.map(m => (
        <div key={m._id} style={{ background: m.bg, overflow: 'hidden', padding: '8px 0', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', gap: 60, color: m.textColor, fontSize: 14, fontWeight: 600,
            whiteSpace: 'nowrap', animation: `mq_${m._id.slice(-6)} ${200/m.speed}s linear infinite`,
            paddingLeft: '100vw',
          }}>
            {[...Array(4)].map((_, i) => <span key={i}>{m.text}</span>)}
          </div>
          <style>{`@keyframes mq_${m._id.slice(-6)} { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>
      ))}
    </>
  );
}