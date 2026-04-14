import { useState, useEffect } from 'react';

let _setLoading = null;
let _count = 0;

export const showLoader = () => {
  _count++;
  _setLoading?.(true);
};
export const hideLoader = () => {
  _count = Math.max(0, _count - 1);
  if (_count === 0) _setLoading?.(false);
};

// Wrap around React Query so every query/mutation shows the loader
export const useGlobalLoader = () => {
  const [loading, setLoading] = useState(false);
  useEffect(() => { _setLoading = setLoading; return () => { _setLoading = null; }; }, []);
  return loading;
};

export default function GlobalLoader() {
  const loading = useGlobalLoader();
  if (!loading) return null;
  return (
    <div className="admin-component-global-loader" id="admin-component-global-loader" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100000,
      height: 3, background: 'var(--color-primary, #2e7d32)',
    }}>
      <div style={{
        height: '100%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.6) 50%, transparent 100%)',
        animation: 'shimmer 1.2s ease-in-out infinite',
        backgroundSize: '200% 100%',
      }} />
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}