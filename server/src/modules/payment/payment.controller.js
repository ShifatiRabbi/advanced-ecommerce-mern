import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess }  from '../../utils/response.js';
import { env }          from '../../config/env.js';
import * as ssl    from './sslcommerz.service.js';
import * as bkash  from './bkash.service.js';
import * as manual from './manual.service.js';

export const initSSL = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await ssl.initiateSSLPayment(orderId);
  sendSuccess(res, { data: result });
});

export const sslSuccess = asyncHandler(async (req, res) => {
  const result = await ssl.handleSSLSuccess(req.body);
  if (result.success) {
    return res.redirect(`${env.CLIENT_URL}/payment/success?method=ssl`);
  }
  res.redirect(`${env.CLIENT_URL}/payment/fail?reason=validation_failed`);
});

export const sslFail = asyncHandler(async (req, res) => {
  await ssl.handleSSLFail(req.body);
  res.redirect(`${env.CLIENT_URL}/payment/fail?method=ssl`);
});

export const sslCancel = asyncHandler(async (req, res) => {
  await ssl.handleSSLFail(req.body);
  res.redirect(`${env.CLIENT_URL}/payment/cancel`);
});

export const sslIPN = asyncHandler(async (req, res) => {
  await ssl.handleSSLIPN(req.body);
  res.status(200).send('IPN received');
});

export const createBkash = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const result = await bkash.createBkashPayment(orderId);
  sendSuccess(res, { data: result });
});

export const bkashCallback = asyncHandler(async (req, res) => {
  const { paymentID, status } = req.query;
  const { orderId } = req.query;
  const result = await bkash.executeBkashPayment({ paymentID, orderId, status });
  if (result.success) {
    return res.redirect(`${env.CLIENT_URL}/payment/success?method=bkash&trx=${result.trxID}`);
  }
  res.redirect(`${env.CLIENT_URL}/payment/fail?method=bkash&reason=${encodeURIComponent(result.message)}`);
});

export const refundBkash = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  const result = await bkash.refundBkashPayment(paymentId, amount, reason);
  sendSuccess(res, { data: result });
});

export const confirmManual = asyncHandler(async (req, res) => {
  const payment = await manual.confirmManualPayment({ ...req.body, adminId: req.user.id });
  sendSuccess(res, { data: payment });
});

export const getPayments = asyncHandler(async (req, res) => {
  const result = await manual.getPayments(req.query);
  sendSuccess(res, { data: result });
});

export const getOrderPayment = asyncHandler(async (req, res) => {
  const payment = await manual.getPaymentByOrder(req.params.orderId);
  sendSuccess(res, { data: payment });
});