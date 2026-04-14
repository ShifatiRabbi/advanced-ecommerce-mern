import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function Countdown({ timer }) {
  // Memoized calculation logic to handle both looping and fixed timers
  const calcRemaining = useCallback(() => {
    const startMs = new Date(timer.startTime).getTime();
    const durationMs = (timer.durationHours || 0) * 3600_000;
    const elapsed = Date.now() - startMs;

    if (timer.loopAfterHours) {
      const loopMs = timer.loopAfterHours * 3600_000;
      const inLoop = elapsed % loopMs;
      // If we are currently within the "active" window of the loop
      const remaining = loopMs - inLoop;
      // Ensure we only show the timer if the remaining time is within the duration window
      return remaining > (loopMs - durationMs) ? remaining - (loopMs - durationMs) : 0;
    }
    
    return Math.max(0, durationMs - elapsed);
  }, [timer]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    setRemaining(calcRemaining()); // Sync immediately on timer change
    const id = setInterval(() => {
      const next = calcRemaining();
      setRemaining(next);
    }, 1000);
    
    return () => clearInterval(id);
  }, [calcRemaining]);

  // Hide component if time is up and it's not a looping timer
  if (remaining <= 0 && !timer.loopAfterHours) return null;

  const h = String(Math.floor(remaining / 3_600_000)).padStart(2, '0');
  const m = String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, '0');
  const s = String(Math.floor((remaining % 60_000) / 1_000)).padStart(2, '0');

  return (
    <div className="client-component-countdown" id="client-component-countdown" style={{ 
      background: timer.bgColor || '#ef4444', 
      borderRadius: 8, 
      padding: '10px 14px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: 10, 
      marginBottom: 12 
    }}>
      <span style={{ color: timer.textColor || '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
        {timer.label || 'Offer ends in'}
      </span>
      
      <div style={{ display: 'flex', gap: 4 }}>
        {[[h, 'H'], [m, 'M'], [s, 'S']].map(([val, unit]) => (
          <div key={unit} style={{ textAlign: 'center' }}>
            <span style={{ 
              display: 'block', 
              background: 'rgba(0,0,0,.25)', 
              color: timer.textColor || '#fff', 
              fontFamily: 'monospace', 
              fontSize: 20, 
              fontWeight: 800, 
              padding: '3px 8px', 
              borderRadius: 5, 
              minWidth: 38 
            }}>
              {val}
            </span>
            <span style={{ 
              display: 'block', 
              color: timer.textColor || '#fff', 
              fontSize: 9, 
              opacity: .7, 
              marginTop: 2 
            }}>
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductTimer({ productId, categoryId, position = 'above-price' }) {
  const { data: timers = [] } = useQuery({
    queryKey: ['timers', productId ?? 'all', categoryId ?? 'all', position],
    queryFn: () => api.get('/timers', {
      params: {
        ...(productId && { productId }),
        ...(categoryId && { categoryId }),
        position,
      },
    }).then(r => r.data.data),
    staleTime: 60_000,
  });

  if (!timers.length) return null;

  return (
    <div className="client-component-product-timer" id="client-component-product-timer" style={{ display: 'contents' }}>
      {timers.map(t => (
        <Countdown key={t._id} timer={t} />
      ))}
    </div>
  );
}