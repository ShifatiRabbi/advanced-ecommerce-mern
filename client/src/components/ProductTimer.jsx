import { useState, useEffect } from 'react';
import { useQuery }            from '@tanstack/react-query';
import api from '../services/api';

function Countdown({ timer }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const start     = new Date(timer.startTime).getTime();
      const durationMs = timer.durationHours * 3600 * 1000;
      const elapsed   = Date.now() - start;

      let rem;
      if (timer.loopAfterHours) {
        const loopMs = timer.loopAfterHours * 3600 * 1000;
        rem = loopMs - (elapsed % loopMs);
        if (rem > durationMs) rem = durationMs;
      } else {
        rem = Math.max(0, durationMs - elapsed);
      }
      setRemaining(rem);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (remaining <= 0 && !timer.loopAfterHours) return null;

  const h  = String(Math.floor(remaining / 3600000)).padStart(2, '0');
  const m  = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
  const s2 = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

  return (
    <div style={{ background: timer.bgColor, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <span style={{ color: timer.textColor, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
        {timer.label || 'Offer ends in'}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[[h, 'H'], [m, 'M'], [s2, 'S']].map(([val, unit]) => (
          <div key={unit} style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', background: 'rgba(0,0,0,0.25)', color: timer.textColor, fontFamily: 'monospace', fontSize: 20, fontWeight: 800, padding: '3px 8px', borderRadius: 5, minWidth: 36 }}>
              {val}
            </span>
            <span style={{ display: 'block', color: timer.textColor, fontSize: 9, opacity: 0.7, marginTop: 2 }}>{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductTimer({ productId, categoryId, position = 'above-price' }) {
  const { data: timers = [] } = useQuery({
    queryKey: ['timers', productId, categoryId],
    queryFn:  () => api.get('/timers', {
      params: { productId: productId || undefined, categoryId: categoryId || undefined },
    }).then(r => r.data.data),
    staleTime: 1000 * 60,
  });

  const filtered = timers.filter(t => t.position === position);
  if (!filtered.length) return null;

  return (
    <>
      {filtered.map(timer => <Countdown key={timer._id} timer={timer} />)}
    </>
  );
}