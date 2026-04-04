import { User } from './user.model.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';

export const registerUser = async ({ name, email, phone, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const user = await User.create({ name, email, phone, password });
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