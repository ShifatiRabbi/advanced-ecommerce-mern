import { Product } from '../product/product.model.js';

export const getLowStockProducts = async (threshold = 10) =>
  Product.find({ stock: { $lte: threshold }, isActive: true })
    .sort({ stock: 1 })
    .select('name slug stock sku images category')
    .populate('category', 'name')
    .lean();

export const bulkUpdateStock = async (updates) => {
  const ops = updates.map(({ id, stock, sku }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { ...(stock !== undefined && { stock: Number(stock) }), ...(sku && { sku }) } },
    },
  }));
  return Product.bulkWrite(ops);
};

export const adjustStock = async (id, delta, reason) => {
  const product = await Product.findById(id);
  if (!product) { const e = new Error('Product not found'); e.status = 404; throw e; }
  const newStock = Math.max(0, product.stock + delta);
  product.stock = newStock;
  return product.save();
};

export const getStockSummary = async () => {
  const [total, outOfStock, lowStock] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: 0, isActive: true }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 10 }, isActive: true }),
  ]);
  return { total, outOfStock, lowStock, healthy: total - outOfStock - lowStock };
};