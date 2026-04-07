import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const useSliders = (position, page = '/') =>
  useQuery({
    queryKey: ['sliders', position, page],
    queryFn:  () => api.get('/sliders', { params: { position, page } }).then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

function SingleSlider({ slider }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const slides = slider.slides || [];

  const next = () => setCurrent(c => (c + 1) % slides.length);
  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (!slider.autoPlay || slides.length <= 1) return;
    timerRef.current = setInterval(next, slider.interval || 4000);
    return () => clearInterval(timerRef.current);
  }, [slider.autoPlay, slider.interval, slides.length]);

  if (!slides.length) return null;
  const slide = slides[current];

  return (
    <div style={{ position: 'relative', height: slider.height || '480px', overflow: 'hidden', background: slide.bgColor }}>
      {slide.imageUrl && (
        <img src={slide.imageUrl} alt={slide.heading}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {slide.imageUrl && slide.overlay > 0 && (
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${slide.overlay/100})` }} />
      )}

      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: slide.align === 'center' ? 'center' : slide.align === 'right' ? 'flex-end' : 'flex-start',
        justifyContent: 'center', padding: '0 60px',
        textAlign: slide.align, color: slide.textColor,
      }}>
        {slide.heading && (
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 52px)', fontWeight: 900, margin: '0 0 12px', color: slide.textColor, lineHeight: 1.15 }}>
            {slide.heading}
          </h2>
        )}
        {slide.subheading && (
          <p style={{ fontSize: 'clamp(14px, 2vw, 22px)', margin: '0 0 28px', opacity: 0.9, color: slide.textColor, maxWidth: 640 }}>
            {slide.subheading}
          </p>
        )}
        {slide.buttonLabel && slide.buttonUrl && (
          <Link to={slide.buttonUrl}
            style={{
              display: 'inline-block', padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16,
              ...(slide.buttonStyle === 'outline'
                ? { border: `2px solid ${slide.textColor}`, color: slide.textColor, background: 'transparent' }
                : { background: slide.textColor, color: slide.bgColor }),
            }}>
            {slide.buttonLabel}
          </Link>
        )}
      </div>

      {slider.showArrows && slides.length > 1 && (
        <>
          <button onClick={prev}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ‹
          </button>
          <button onClick={next}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ›
          </button>
        </>
      )}

      {slider.showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, background: i === current ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'width .3s, background .3s', padding: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SliderRenderer({ position, page = '/' }) {
  const { data: sliders = [] } = useSliders(position, page);
  if (!sliders.length) return null;
  return (
    <>
      {sliders.map(slider => <SingleSlider key={slider._id} slider={slider} />)}
    </>
  );
}