import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as ie from './productImportExport.service.js';

export const exportCsv = asyncHandler(async (req, res) => {
  const format = String(req.query.format || 'shopify').toLowerCase();
  const csv = await ie.exportProductsCsv(format);
  const name = ['shopify', 'woocommerce', 'wordpress'].includes(format) ? format : 'export';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="products-${name}.csv"`);
  res.send(`\uFEFF${csv}`);
});

export const importCsv = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    const e = new Error('CSV file is required (field name: file)');
    e.status = 400;
    throw e;
  }
  const format = String(req.body.format || '').toLowerCase();
  if (!format) {
    const e = new Error('Body field "format" is required: shopify | woocommerce | wordpress');
    e.status = 400;
    throw e;
  }
  const result = await ie.importProductsFromCsv(req.file.buffer, format, req.file.originalname);
  sendSuccess(res, { message: 'Import finished', data: result });
});
