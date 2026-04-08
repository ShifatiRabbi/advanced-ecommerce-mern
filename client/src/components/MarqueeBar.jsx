import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function MarqueeBar({ position = 'below-header', productId, categoryId, page }) {
  const params = {};
  if (position)   params.position   = position;
  if (productId)  params.productId  = productId;
  if (categoryId) params.categoryId = categoryId;
  if (page)       params.page       = page;

  const { data: marquees = [] } = useQuery({
    // productId and categoryId are normalized to 'all' to prevent cache fragmentation
    queryKey: ['marquees', position, productId ?? 'all', categoryId ?? 'all', page ?? 'home'],
    queryFn:  () => api.get('/marquees', { params }).then(r => r.data.data),
    staleTime: 60_000,
  });

  if (!marquees.length) return null;

  return (
    <div>
      {marquees.map(m => {
        // Calculate speed (minimum 5s to prevent seizure-inducing speeds)
        const animDuration = `${Math.max(5, Math.round(200 / (m.speed || 10)))}s`;
        const animName     = `mq${m._id.slice(-8)}`;

        return (
          <div 
            key={m._id} 
            style={{ 
              background: m.bg || '#111827', 
              overflow: 'hidden', 
              padding: '9px 0', 
              position: 'relative',
              width: '100%' 
            }}
          >
            {/* Inject keyframes specifically for this marquee instance */}
            <style>
              {`@keyframes ${animName} {
                from { transform: translateX(100vw); }
                to { transform: translateX(-100%); }
              }`}
            </style>
            
            <div style={{
              display: 'inline-block', 
              whiteSpace: 'nowrap',
              color: m.textColor || '#fff', 
              fontSize: 14, 
              fontWeight: 600,
              animation: `${animName} ${animDuration} linear infinite`,
              willChange: 'transform' // Performance optimization
            }}>
              {/* Join text with separators for a cleaner continuous look */}
              {[m.text, m.text, m.text].join('    •    ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}