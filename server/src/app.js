import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';
import mongoSanitize from 'express-mongo-sanitize';
import xss           from 'xss-clean';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [env.CLIENT_URL, env.ADMIN_URL],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Add after JSON parser:
app.use(mongoSanitize());
app.use(xss());

if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.use('/api', apiLimiter, apiRoutes);
// Also serve sitemap and robots at root level:
app.get('/sitemap.xml', (req, res) => res.redirect('/api/seo/sitemap.xml'));
app.get('/robots.txt',  (req, res) => res.redirect('/api/seo/robots.txt'));

// Helmet with stronger CSP:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://connect.facebook.net', 'https://js.stripe.com'],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com', 'https://www.google-analytics.com'],
      connectSrc:  ["'self'", 'https://www.google-analytics.com'],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(notFound);
app.use(errorHandler);

export default app;