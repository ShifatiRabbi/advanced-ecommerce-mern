import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as userService from './user.service.js';

export const register = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  sendSuccess(res, { status: 201, message: 'Registered successfully', data: user });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await userService.loginUser(req.body);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  sendSuccess(res, { message: 'Login successful', data: { user, accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
  const { accessToken, refreshToken } = await userService.refreshAccessToken(token);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  sendSuccess(res, { data: { accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  await userService.logoutUser(req.user.id);
  res.clearCookie('refreshToken');
  sendSuccess(res, { message: 'Logged out' });
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});