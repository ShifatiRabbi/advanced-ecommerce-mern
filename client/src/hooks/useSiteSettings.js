import { useEffect } from 'react';
import { useQuery }  from '@tanstack/react-query';
import api from '../services/api';

export const useSiteSettings = () => {
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn:  () => api.get('/settings/all').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    // ── Theme CSS variables
    const CSS_MAP = {
      colorPrimary:     '--color-primary',
      colorSecondary:   '--color-secondary',
      colorAccent:      '--color-accent',
      colorHover:       '--color-hover',
      colorSuccess:     '--color-success',
      colorDanger:      '--color-danger',
      colorBackground:  '--color-background',
      colorSurface:     '--color-surface',
      colorText:        '--color-text',
      colorTextMuted:   '--color-text-muted',
      colorBorder:      '--color-border',
      fontFamily:       '--font-family',
      fontSizeBase:     '--font-size-base',
      btnRadius:        '--btn-radius',
      btnPaddingX:      '--btn-padding-x',
      btnPaddingY:      '--btn-padding-y',
      btnFontWeight:    '--btn-font-weight',
      btnFontSize:      '--btn-font-size',
      cardRadius:       '--card-radius',
      cardBorder:       '--card-border',
      cardShadow:       '--card-shadow',
      inputRadius:      '--input-radius',
      headerBg:         '--header-bg',
      headerTextColor:  '--header-text-color',
      footerBg:         '--footer-bg',
      footerTextColor:  '--footer-text-color',
    };

    // Theme is stored as a single object under key 'theme'
    const theme = settings.theme || {};
    Object.entries(CSS_MAP).forEach(([key, cssVar]) => {
      if (theme[key]) root.style.setProperty(cssVar, theme[key]);
    });

    // ── Favicon
    if (settings.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = settings.favicon;
    }

    // ── Site title default
    if (settings.siteName) {
      const metaOg = document.querySelector('meta[property="og:site_name"]');
      if (!metaOg) {
        const m = document.createElement('meta');
        m.setAttribute('property', 'og:site_name');
        m.content = settings.siteName;
        document.head.appendChild(m);
      }
    }

    // ── Custom CSS
    let styleEl = document.getElementById('shopbd-custom-css');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'shopbd-custom-css'; document.head.appendChild(styleEl); }
    styleEl.textContent = settings.customCss || '';

    // ── Custom JS (fire once)
    if (settings.customJs && !window.__customJsLoaded) {
      window.__customJsLoaded = true;
      const script = document.createElement('script');
      script.id = 'shopbd-custom-js';
      script.textContent = settings.customJs;
      document.body.appendChild(script);
    }
  }, [settings]);

  return settings;
};