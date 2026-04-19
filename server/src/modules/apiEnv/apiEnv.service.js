import {
  OVERRIDABLE_ENV_KEYS,
  AI_ENV_KEYS,
  EXTRA_SUGGESTED_ENV_KEYS,
  rebuildEnvFromProcessAndDb,
} from '../../config/env.js';
import { reconfigureCloudinaryFromEnv } from '../../config/cloudinary.js';
import { ApiEnvConfig } from './apiEnv.model.js';

const SENSITIVE_KEY =
  /SECRET|PASSWORD|PASS|TOKEN|API_KEY|_KEY$|JWT_ACCESS_SECRET|JWT_REFRESH_SECRET|MONGO_URI/i;

const groupForKey = (k) => {
  if (k.startsWith('CLOUDINARY')) return 'Cloudinary';
  if (k.startsWith('JWT')) return 'JWT / auth';
  if (k.startsWith('SSL_')) return 'SSLCommerz';
  if (k.startsWith('BKASH')) return 'bKash';
  if (k.startsWith('PATHAO')) return 'Pathao';
  if (k.startsWith('STEADFAST')) return 'Steadfast';
  if (k.startsWith('FRAUDBD')) return 'FraudBD';
  if (k.startsWith('MONGO')) return 'Database';
  if (k === 'CLIENT_URL' || k === 'ADMIN_URL') return 'URLs';
  if (AI_ENV_KEYS.includes(k)) return 'AI / LLM (from .env)';
  return 'Other';
};

const labelForKey = (k) =>
  k
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const maskValue = (val) => {
  if (val == null) return null;
  const t = String(val).trim();
  if (!t) return null;
  if (t.length <= 4) return '••••';
  return `••••${t.slice(-4)}`;
};

const effectiveString = (k) => {
  const fromProcess = process.env[k];
  if (fromProcess != null && String(fromProcess).trim() !== '') return String(fromProcess);
  return null;
};

export const getStoredDocLean = async () =>
  (await ApiEnvConfig.findOne({ singleton: 'default' }).lean()) || {
    overrides: {},
    custom: {},
  };

export const loadApiEnvAndRebuild = async () => {
  const doc = await getStoredDocLean();
  rebuildEnvFromProcessAndDb(doc);
  reconfigureCloudinaryFromEnv();
};

const pickPlain = (doc) => ({
  overrides: doc?.overrides && typeof doc.overrides === 'object' ? { ...doc.overrides } : {},
  custom: doc?.custom && typeof doc.custom === 'object' ? { ...doc.custom } : {},
});

export const getAdminView = async () => {
  const doc = pickPlain(await getStoredDocLean());

  const managed = OVERRIDABLE_ENV_KEYS.map((key) => {
    const fromDb = doc.overrides[key] != null && String(doc.overrides[key]).trim() !== '';
    const fromEnv = effectiveString(key) != null;
    const effective = fromDb ? String(doc.overrides[key]) : effectiveString(key);
    const sensitive = SENSITIVE_KEY.test(key);
    return {
      key,
      group: groupForKey(key),
      label: labelForKey(key),
      sensitive,
      hasDatabaseOverride: fromDb,
      hasEnvValue: fromEnv,
      maskedPreview: sensitive ? maskValue(effective) : effective || null,
      displayHint: sensitive
        ? 'Type a new value to replace the stored secret, or use Clear override to use .env only.'
        : 'Type a new value to save, or use Clear override to use .env only.',
    };
  });

  const customKeys = Object.keys(doc.custom).sort();
  const custom = customKeys.map((key) => {
    const val = doc.custom[key];
    const sensitive = SENSITIVE_KEY.test(key);
    return {
      key,
      sensitive,
      maskedPreview: sensitive ? maskValue(val) : val || null,
      hasDatabaseOverride: true,
    };
  });

  return {
    managed,
    custom,
    suggestedAdvancedKeys: [...EXTRA_SUGGESTED_ENV_KEYS],
  };
};

export const upsertApiEnvConfig = async ({ overrides: bodyOverrides, custom: bodyCustom } = {}) => {
  const current = pickPlain(await getStoredDocLean());
  const nextOverrides = { ...current.overrides };
  const nextCustom = { ...current.custom };

  if (bodyOverrides !== undefined && typeof bodyOverrides === 'object') {
    for (const [k, v] of Object.entries(bodyOverrides)) {
      if (!OVERRIDABLE_ENV_KEYS.includes(k)) continue;
      if (v === null || v === undefined || String(v).trim() === '') delete nextOverrides[k];
      else nextOverrides[k] = String(v).trim();
    }
  }

  if (bodyCustom !== undefined && typeof bodyCustom === 'object') {
    for (const [k, v] of Object.entries(bodyCustom)) {
      if (!/^[A-Z][A-Z0-9_]{0,127}$/.test(k)) continue;
      if (k === 'NODE_ENV' || k === 'PORT') continue;
      if (OVERRIDABLE_ENV_KEYS.includes(k)) continue;
      if (v === null || v === undefined || String(v).trim() === '') delete nextCustom[k];
      else nextCustom[k] = String(v).trim();
    }
  }

  await ApiEnvConfig.findOneAndUpdate(
    { singleton: 'default' },
    { $set: { overrides: nextOverrides, custom: nextCustom } },
    { upsert: true, new: true }
  );

  await loadApiEnvAndRebuild();
  return getAdminView();
};
