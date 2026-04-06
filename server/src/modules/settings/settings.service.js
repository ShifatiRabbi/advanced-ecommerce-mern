import { Settings } from './settings.model.js';

const DEFAULTS = {
  header: 'header1',
  footer: 'footer1',
};

export const getLayoutSettings = async () => {
  const [header, footer] = await Promise.all([
    Settings.findOne({ key: 'header' }),
    Settings.findOne({ key: 'footer' }),
  ]);

  return {
    header: header?.value ?? DEFAULTS.header,
    footer: footer?.value ?? DEFAULTS.footer,
  };
};

export const updateLayoutSettings = async ({ header, footer }) => {
  const ops = [];
  if (header) ops.push(Settings.findOneAndUpdate({ key: 'header' }, { value: header }, { upsert: true, new: true }));
  if (footer) ops.push(Settings.findOneAndUpdate({ key: 'footer' }, { value: footer }, { upsert: true, new: true }));
  await Promise.all(ops);
  return getLayoutSettings();
};

export const getCustomCode = async () => {
  const [css, js, headerScripts] = await Promise.all([
    Settings.findOne({ key: 'customCss' }),
    Settings.findOne({ key: 'customJs' }),
    Settings.findOne({ key: 'headerScripts' }),
  ]);
  return {
    customCss:     css?.value     || '',
    customJs:      js?.value      || '',
    headerScripts: headerScripts?.value || '',
  };
};

export const saveCustomCode = async ({ customCss, customJs, headerScripts }) => {
  await Promise.all([
    Settings.findOneAndUpdate({ key: 'customCss' },     { value: customCss     || '' }, { upsert: true }),
    Settings.findOneAndUpdate({ key: 'customJs' },      { value: customJs      || '' }, { upsert: true }),
    Settings.findOneAndUpdate({ key: 'headerScripts' }, { value: headerScripts || '' }, { upsert: true }),
  ]);
  return getCustomCode();
};

export const DEFAULT_THEME = {
  colorPrimary:     '#111827',
  colorSecondary:   '#6b7280',
  colorAccent:      '#3b82f6',
  colorSuccess:     '#059669',
  colorDanger:      '#dc2626',
  colorWarning:     '#d97706',
  colorBackground:  '#ffffff',
  colorSurface:     '#f9fafb',
  colorText:        '#111827',
  colorTextMuted:   '#6b7280',
  colorBorder:      '#e5e7eb',
  colorHover:       '#374151',
  fontFamily:       'system-ui, -apple-system, sans-serif',
  fontSizeBase:     '16px',
  btnRadius:        '8px',
  btnPaddingX:      '20px',
  btnPaddingY:      '10px',
  btnFontWeight:    '600',
  btnFontSize:      '14px',
  cardRadius:       '12px',
  cardBorder:       '1px solid #e5e7eb',
  cardShadow:       'none',
  inputRadius:      '8px',
  headerBg:         '#111827',
  headerTextColor:  '#ffffff',
  footerBg:         '#111827',
  footerTextColor:  '#9ca3af',
};

export const getTheme = async () => {
  const doc = await Settings.findOne({ key: 'theme' });
  return { ...DEFAULT_THEME, ...(doc?.value || {}) };
};

export const updateTheme = async (data) => {
  await Settings.findOneAndUpdate({ key: 'theme' }, { value: data }, { upsert: true, new: true });
  return getTheme();
};

export const resetTheme = async () => {
  await Settings.findOneAndDelete({ key: 'theme' });
  return DEFAULT_THEME;
};