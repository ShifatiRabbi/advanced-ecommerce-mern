import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import * as svc from './order.service.js';

export const trackIncomplete = asyncHandler(async (req, res) => {
  const order = await svc.saveIncompleteOrder({
    ...req.body,
    ip:        req.ip,
    userAgent: req.headers['user-agent'],
  });
  sendSuccess(res, { status: 201, data: { sessionId: order._id } });
});

export const placeOrder = asyncHandler(async (req, res) => {
  const order = await svc.createOrder({
    userId:          req.user?.id || null,
    ...req.body,
    ip:              req.ip,
    userAgent:       req.headers['user-agent'],
  });
  sendSuccess(res, {
    status: 201,
    message: order.isFake ? 'Order received (under review)' : 'Order placed successfully',
    data: { orderNumber: order.orderNumber, status: order.status, total: order.total },
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const result = await svc.getOrders(req.query);
  sendSuccess(res, { data: result });
});

export const getOne = asyncHandler(async (req, res) => {
  const order = await svc.getOrderById(req.params.id);
  sendSuccess(res, { data: order });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await svc.getOrderByNumber(req.params.orderNumber);
  sendSuccess(res, { data: order });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await svc.updateOrderStatus(req.params.id, req.body.status, req.body.adminNote);
  sendSuccess(res, { data: order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const result = await svc.getUserOrders(req.user.id, req.query);
  sendSuccess(res, { data: result });
});

export const stats = asyncHandler(async (req, res) => {
  const data = await svc.getOrderStats();
  sendSuccess(res, { data });
});