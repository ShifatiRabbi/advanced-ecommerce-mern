export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || null;

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${status} — ${message}`, err.stack);
  }

  res.status(status).json({ success: false, message, errors });
};

export const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};