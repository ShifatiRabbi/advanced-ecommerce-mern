export const sendSuccess = (res, { status = 200, message = 'Success', data = null } = {}) => {
  res.status(status).json({ success: true, message, data });
};

export const sendError = (res, { status = 500, message = 'Server error', errors = null } = {}) => {
  res.status(status).json({ success: false, message, errors });
};