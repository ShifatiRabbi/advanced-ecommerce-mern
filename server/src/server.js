import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { loadApiEnvAndRebuild } from './modules/apiEnv/apiEnv.service.js';

const start = async () => {
  await connectDB();
  await loadApiEnvAndRebuild();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

start();