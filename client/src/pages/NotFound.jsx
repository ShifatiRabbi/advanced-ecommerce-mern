import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function NotFound() {
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';

  return (
    <div className="client-page-notfound" id="client-page-notfound" style={s.page}>
      <Helmet>
        <title>404 - {siteName}</title>
      </Helmet>
      <div style={s.card}>
        <p style={s.code}>404</p>
        <h1 style={s.title}>Page not found</h1>
        <p style={s.sub}>The page you are looking for does not exist or has been moved.</p>
        <Link to="/" style={s.btn}>Back to Home</Link>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-background, #fff)' },
  card: { maxWidth: 520, width: '100%', textAlign: 'center', border: 'var(--card-border, 1px solid #e5e7eb)', borderRadius: 'var(--card-radius, 12px)', padding: '36px 24px', background: 'var(--color-surface, #fff)' },
  code: { margin: 0, fontSize: 48, fontWeight: 800, color: 'var(--color-primary, #111827)' },
  title: { margin: '6px 0 8px', fontSize: 28, color: 'var(--color-text, #111827)' },
  sub: { margin: '0 0 22px', color: 'var(--color-text-muted, #6b7280)', fontSize: 15 },
  btn: { display: 'inline-block', textDecoration: 'none', background: 'var(--color-primary, #111827)', color: '#fff', padding: '10px 18px', borderRadius: 'var(--btn-radius, 8px)', fontWeight: 600 },
};
