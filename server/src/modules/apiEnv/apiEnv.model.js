import mongoose from 'mongoose';

const apiEnvConfigSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'default', unique: true },
    /** Values saved from admin for keys listed in `OVERRIDABLE_ENV_KEYS` (replaces .env when set). */
    overrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Arbitrary UPPER_SNAKE_CASE keys (e.g. AI provider API keys) merged into runtime `env`. */
    custom: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

apiEnvConfigSchema.index({ singleton: 1 });

export const ApiEnvConfig = mongoose.model('ApiEnvConfig', apiEnvConfigSchema);
