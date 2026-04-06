import { useEffect } from 'react';
import { useQuery }  from '@tanstack/react-query';
import api from '../services/api';

const CSS_VAR_MAP = {
  colorPrimary:     '--color-primary',
  colorSecondary:   '--color-secondary',
  colorAccent:      '--color-accent',
  colorSuccess:     '--color-success',
  colorDanger:      '--color-danger',
  colorWarning:     '--color-warning',
  colorBackground:  '--color-background',
  colorSurface:     '--color-surface',
  colorText:        '--color-text',
  colorTextMuted:   '--color-text-muted',
  colorBorder:      '--color-border',
  colorHover:       '--color-hover',
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

export const useTheme = () => {
  const { data: theme } = useQuery({
    queryKey: ['theme-client'],
    queryFn:  () => api.get('/settings/theme').then(r=>r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
      if (theme[key]) root.style.setProperty(cssVar, theme[key]);
    });
    if (theme.fontFamily) root.style.setProperty('font-family', theme.fontFamily);
  }, [theme]);
};