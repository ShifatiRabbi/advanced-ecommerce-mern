// src/modules/user/user.controller.js
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as userService from './user.service.js';
import { env } from '../../config/env.js';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req, res) => {
  const user = await userService.registerUser(req.body);
  sendSuccess(res, { status: 201, message: 'Registered successfully', data: user });
});

/**
 * Login a user (admin/employee)
 */
export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await userService.loginUser(req.body);

  // Save refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendSuccess(res, { message: 'Login successful', data: { user, accessToken } });
});

/**
 * Refresh access token
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

  const { accessToken, refreshToken } = await userService.refreshAccessToken(token);

  // Update cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, { data: { accessToken } });
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req, res) => {
  await userService.logoutUser(req.user.id);
  res.clearCookie('refreshToken');
  sendSuccess(res, { message: 'Logged out' });
});

/**
 * Get currently logged-in user
 */
export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});

/**
 * Request password reset (forgot password)
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  await userService.requestPasswordReset(req.body.email, env.CLIENT_URL);
  sendSuccess(res, { message: 'If that email exists, a reset link was sent.' });
});

/**
 * Reset password using token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  await userService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, { message: 'Password reset successfully' });
});