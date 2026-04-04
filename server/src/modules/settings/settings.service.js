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