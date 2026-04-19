import dotenv from 'dotenv';

dotenv.config();

/** Optional AI / LLM keys read from process.env; may also be set only via DB `custom`. */
export const AI_ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_ORG_ID',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'XAI_API_KEY',
  'GROK_API_KEY',
  'COHERE_API_KEY',
  'MISTRAL_API_KEY',
];

/** Shown as quick-add chips for *custom* keys (not already managed above). */
export const EXTRA_SUGGESTED_ENV_KEYS = [
  'PERPLEXITY_API_KEY',
  'DEEPSEEK_API_KEY',
  'HUGGINGFACE_API_TOKEN',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'LANGCHAIN_API_KEY',
  'OPENAI_BASE_URL',
  'ANTHROPIC_BASE_URL',
];

const buildBaseEnvSnapshot = () => {
  const aiFromProcess = Object.fromEntries(
    AI_ENV_KEYS.map((k) => [k, process.env[k]])
  );

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
    CLIENT_URL: process.env.CLIENT_URL,
    ADMIN_URL: process.env.ADMIN_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

    SSL_STORE_ID: process.env.SSL_STORE_ID,
    SSL_STORE_PASS: process.env.SSL_STORE_PASS,
    SSL_IS_LIVE: process.env.SSL_IS_LIVE || 'false',
    SSL_SUCCESS_URL: process.env.SSL_SUCCESS_URL,
    SSL_FAIL_URL: process.env.SSL_FAIL_URL,
    SSL_CANCEL_URL: process.env.SSL_CANCEL_URL,
    SSL_IPN_URL: process.env.SSL_IPN_URL,

    BKASH_BASE_URL: process.env.BKASH_BASE_URL,
    BKASH_APP_KEY: process.env.BKASH_APP_KEY,
    BKASH_APP_SECRET: process.env.BKASH_APP_SECRET,
    BKASH_USERNAME: process.env.BKASH_USERNAME,
    BKASH_PASSWORD: process.env.BKASH_PASSWORD,
    BKASH_CALLBACK_URL: process.env.BKASH_CALLBACK_URL,

    PATHAO_BASE_URL: process.env.PATHAO_BASE_URL,
    PATHAO_CLIENT_ID: process.env.PATHAO_CLIENT_ID,
    PATHAO_CLIENT_SECRET: process.env.PATHAO_CLIENT_SECRET,
    PATHAO_USERNAME: process.env.PATHAO_USERNAME,
    PATHAO_PASSWORD: process.env.PATHAO_PASSWORD,

    STEADFAST_BASE_URL: process.env.STEADFAST_BASE_URL,
    STEADFAST_API_KEY: process.env.STEADFAST_API_KEY,
    STEADFAST_SECRET_KEY: process.env.STEADFAST_SECRET_KEY,

    FRAUDBD_BASE_URL: process.env.FRAUDBD_BASE_URL,
    FRAUDBD_API_KEY: process.env.FRAUDBD_API_KEY,

    ...aiFromProcess,
  };
};

/** Keys that may be overridden from the admin API setup (never NODE_ENV / PORT). */
export const OVERRIDABLE_ENV_KEYS = Object.keys(buildBaseEnvSnapshot()).filter(
  (k) => k !== 'NODE_ENV' && k !== 'PORT'
);

export const BLOCKED_CUSTOM_ENV_KEYS = new Set(['NODE_ENV', 'PORT']);

const isValidCustomEnvKey = (k) =>
  typeof k === 'string' && /^[A-Z][A-Z0-9_]{0,127}$/.test(k) && !BLOCKED_CUSTOM_ENV_KEYS.has(k);

/**
 * Mutable runtime config: starts from process.env, then merges DB overrides on startup / after admin save.
 * Same object reference is kept so existing imports keep working.
 */
export const env = {};

export const rebuildEnvFromProcessAndDb = (dbDoc) => {
  const base = buildBaseEnvSnapshot();
  const next = { ...base };

  const overrides = dbDoc?.overrides && typeof dbDoc.overrides === 'object' ? dbDoc.overrides : {};
  const custom = dbDoc?.custom && typeof dbDoc.custom === 'object' ? dbDoc.custom : {};

  for (const [k, v] of Object.entries(overrides)) {
    if (!OVERRIDABLE_ENV_KEYS.includes(k)) continue;
    if (v != null && String(v).trim() !== '') next[k] = v;
  }

  for (const [k, v] of Object.entries(custom)) {
    if (!isValidCustomEnvKey(k)) continue;
    if (v != null && String(v).trim() !== '') next[k] = v;
  }

  next.NODE_ENV = base.NODE_ENV;
  next.PORT = base.PORT;

  for (const key of Object.keys(env)) {
    delete env[key];
  }
  Object.assign(env, next);
};

rebuildEnvFromProcessAndDb(null);
