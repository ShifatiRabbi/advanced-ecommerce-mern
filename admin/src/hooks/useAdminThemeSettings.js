import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const CSS_MAP = {
  colorPrimary: '--color-primary',
  colorSecondary: '--color-secondary',
  colorAccent: '--color-accent',
  colorHover: '--color-hover',
  colorSuccess: '--color-success',
  colorDanger: '--color-danger',
  colorBackground: '--color-background',
  colorSurface: '--color-surface',
  colorText: '--color-text',
  colorTextMuted: '--color-text-muted',
  colorBorder: '--color-border',
  fontFamily: '--font-family',
  fontSizeBase: '--font-size-base',
  btnRadius: '--btn-radius',
  btnPaddingX: '--btn-padding-x',
  btnPaddingY: '--btn-padding-y',
  btnFontWeight: '--btn-font-weight',
  btnFontSize: '--btn-font-size',
  cardRadius: '--card-radius',
  cardBorder: '--card-border',
  cardShadow: '--card-shadow',
  inputRadius: '--input-radius',
  headerBg: '--header-bg',
  headerTextColor: '--header-text-color',
  footerBg: '--footer-bg',
  footerTextColor: '--footer-text-color',
};

export const useAdminThemeSettings = () => {
  const { data: settings } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const [allRes, themeRes] = await Promise.all([
        api.get('/settings/all'),
        api.get('/settings/theme'),
      ]);
      const allSettings = allRes.data.data || {};
      const theme = themeRes.data.data || {};
      return {
        ...allSettings,
        theme: { ...theme, ...(allSettings.theme || {}) },
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const theme = settings.theme || {};
    Object.entries(CSS_MAP).forEach(([key, cssVar]) => {
      if (theme[key]) root.style.setProperty(cssVar, theme[key]);
    });

    if (settings.siteName) {
      document.title = `${settings.siteName} Admin`;
    }

    if (settings.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon;
    }
  }, [settings]);

  return settings;
};
