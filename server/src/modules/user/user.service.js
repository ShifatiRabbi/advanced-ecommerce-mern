import { User } from './user.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { sendWelcomeEmail }      from '../../utils/email.js';
import { sendPasswordReset } from '../../utils/email.js';


export const registerUser = async ({ name, email, phone, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const user = await User.create({ name, email, phone, password });
  sendWelcomeEmail(user).catch(() => {});
  return sanitizeUser(user);
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is disabled');
    err.status = 403;
    throw err;
  }

  const payload = { id: user._id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

export const refreshAccessToken = async (token) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  const user = await User.findById(payload.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    const err = new Error('Refresh token reuse detected');
    err.status = 401;
    throw err;
  }

  const newPayload = { id: user._id, role: user.role };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

export const requestPasswordReset = async (email, siteUrl) => {
  const user = await User.findOne({ email });
  if (!user) return; // silent — don't leak existence
  const token   = crypto.randomBytes(32).toString('hex');
  const hashed  = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetToken   = hashed;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendPasswordReset(email, token, siteUrl).catch(() => {});
};

export const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user   = await User.findOne({
    passwordResetToken:   hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');
  if (!user) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });
  user.password             = newPassword;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};