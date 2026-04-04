import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [env.CLIENT_URL, env.ADMIN_URL],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/api', apiLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;