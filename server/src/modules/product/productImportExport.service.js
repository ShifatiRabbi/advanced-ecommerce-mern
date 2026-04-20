import crypto from 'crypto';
import slugify from 'slugify';
import { parse } from 'csv-parse/sync';
import { Product } from './product.model.js';
import { Category } from '../category/category.model.js';
import { Brand } from '../brand/brand.model.js';

const makeSlug = (name) => slugify(String(name || 'product'), { lower: true, strict: true });
const toNum = (v, fb = 0) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : fb;
};
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const csvEscape = (val) => {
  const s = val == null ? '' : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};
const rowKeysLower = (row) => {
  const m = {};
  for (const [k, v] of Object.entries(row || {})) {
    const key = String(k).replace(/^\uFEFF/, '').trim().toLowerCase();
    m[key] = v;
  }
  return m;
};
const pick = (lower, ...keys) => {
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};
const publicIdFromUrl = (url) => {
  const h = crypto.createHash('sha256').update(url).digest('hex').slice(0, 28);
  return `ext-${h}`;
};
const imageFromUrl = (url, alt = '') => {
  const u = String(url || '').trim();
  if (!u || !/^https?:\/\//i.test(u)) return null;
  return { url: u, public_id: publicIdFromUrl(u), alt: alt || '' };
};

async function findCategoryIdByWooOrShopifyPath(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const segments = s.split('>').map((x) => x.trim()).filter(Boolean);
  const tryNames = [...segments, s.split(',')[0].trim()].filter(Boolean);
  for (const name of tryNames) {
    const cat = await Category.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      isActive: true,
    }).select('_id').lean();
    if (cat) return cat._id;
    const slug = makeSlug(name);
    const bySlug = await Category.findOne({ slug, isActive: true }).select('_id').lean();
    if (bySlug) return bySlug._id;
  }
  const fallback = await Category.findOne({ isActive: true }).sort({ sortOrder: 1, name: 1 }).select('_id').lean();
  return fallback?._id || null;
}

async function findBrandIdByName(raw) {
  const name = String(raw || '').trim();
  if (!name) return null;
  const b = await Brand.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    isActive: true,
  }).select('_id').lean();
  return b?._id || null;
}

async function uniqueSlug(base) {
  let slug = base || 'product';
  let n = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function parseCsvBuffer(buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
  return records.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      out[String(k).replace(/^\uFEFF/, '').trim()] = v;
    }
    return out;
  });
}

/** ── Shopify: group rows by Handle ─────────────────────────────────────── */
function groupShopifyByHandle(records) {
  const map = new Map();
  for (const row of records) {
    const L = rowKeysLower(row);
    const handle = pick(L, 'handle').toLowerCase();
    if (!handle) continue;
    if (!map.has(handle)) map.set(handle, []);
    map.get(handle).push(row);
  }
  return map;
}

function shopifyRowsToPayload(handle, rows) {
  const L0 = rowKeysLower(rows[0]);
  const title = pick(L0, 'title');
  const body = pick(L0, 'body (html)', 'body');
  const vendor = pick(L0, 'vendor');
  const type = pick(L0, 'type');
  const tagsRaw = pick(L0, 'tags');
  const published = pick(L0, 'published', 'published on storefront');
  const seoTitle = pick(L0, 'seo title', 'seo_title');
  const seoDesc = pick(L0, 'seo description', 'seo_description');
  const appId = pick(L0, 'app product id', 'app_product_id');

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const images = [];
  const seenImg = new Set();
  for (const row of rows) {
    const L = rowKeysLower(row);
    const src = pick(L, 'image src', 'image_src');
    const alt = pick(L, 'image alt text', 'image_alt_text');
    const img = imageFromUrl(src, alt);
    if (img && !seenImg.has(img.url)) {
      seenImg.add(img.url);
      images.push(img);
    }
  }

  const optNames = [
    [pick(L0, 'option1 name'), pick(L0, 'option1 value')],
    [pick(L0, 'option2 name'), pick(L0, 'option2 value')],
    [pick(L0, 'option3 name'), pick(L0, 'option3 value')],
  ].filter(([n]) => n);

  const hasVariantOptions = rows.some((row) => {
    const L = rowKeysLower(row);
    return pick(L, 'option1 name') && pick(L, 'option1 value');
  });

  if (!hasVariantOptions && rows.length <= 1) {
    const L = rowKeysLower(rows[0]);
    const vSku = pick(L, 'variant sku');
    const qty = toNum(pick(L, 'variant inventory qty', 'variant inventory quantity'), 0);
    const grams = toNum(pick(L, 'variant grams'), 0);
    const weightKg = grams > 0 ? grams / 1000 : null;
    const price = toNum(pick(L, 'variant price'), 0);
    const compare = pick(L, 'variant compare at price', 'variant compare_at_price');
    const compareN = compare ? toNum(compare, NaN) : NaN;
    let regular = price;
    let sale = null;
    if (Number.isFinite(compareN) && compareN > price) {
      regular = compareN;
      sale = price;
    }
    return {
      format: 'shopify',
      handle,
      appId,
      name: title || handle,
      shortDesc: '',
      description: body,
      vendor,
      type,
      tags,
      published,
      seoTitle,
      seoDesc,
      productType: 'simple',
      sku: vSku,
      stock: qty,
      weight: weightKg,
      price: regular,
      discountPrice: sale,
      images,
      variantRows: null,
    };
  }

  const variantName = optNames.length > 1
    ? optNames.map(([n]) => n).join(' / ')
    : (pick(L0, 'option1 name') || 'Variant');

  const options = rows.map((row) => {
    const L = rowKeysLower(row);
    const parts = [1, 2, 3].map((i) => pick(L, `option${i} value`)).filter(Boolean);
    const label = parts.length ? parts.join(' / ') : (pick(L, 'variant sku') || 'Default');
    const vSku = pick(L, 'variant sku');
    const qty = toNum(pick(L, 'variant inventory qty', 'variant inventory quantity'), 0);
    const grams = toNum(pick(L, 'variant grams'), 0);
    const price = toNum(pick(L, 'variant price'), 0);
    const compare = pick(L, 'variant compare at price', 'variant compare_at_price');
    const compareN = compare ? toNum(compare, NaN) : NaN;
    let regular = price;
    let sale = null;
    if (Number.isFinite(compareN) && compareN > price) {
      regular = compareN;
      sale = price;
    }
    return {
      label,
      sku: vSku,
      regularPrice: regular,
      salePrice: sale,
      priceModifier: 0,
      stock: qty,
      images: [],
    };
  });

  return {
    format: 'shopify',
    handle,
    appId,
    name: title || handle,
    shortDesc: '',
    description: body,
    vendor,
    type,
    tags,
    published,
    seoTitle,
    seoDesc,
    productType: 'variable',
    sku: pick(L0, 'variant sku'),
    stock: options.reduce((s, o) => s + toNum(o.stock, 0), 0),
    weight: null,
    price: 0,
    discountPrice: null,
    basePrice: 0,
    images,
    variantRows: [{ name: variantName, defaultOptionIndex: 0, options }],
  };
}

/** ── WooCommerce / WordPress (Woo CSV) ─────────────────────────────────── */
function groupWooCommerce(records) {
  const list = records.map((row) => ({ row, L: rowKeysLower(row) }));
  const jobs = [];
  const variationHandled = new Set();

  for (const { L } of list) {
    const type = pick(L, 'type').toLowerCase();
    if (type === 'simple') jobs.push({ kind: 'simple', L });
  }

  for (const { L } of list) {
    const type = pick(L, 'type').toLowerCase();
    if (type !== 'variable') continue;
    const pid = String(pick(L, 'id') || '');
    const children = list
      .map((item, idx) => ({ ...item, idx }))
      .filter(({ L: cL }) => {
        if (pick(cL, 'type').toLowerCase() !== 'variation') return false;
        const parent = String(pick(cL, 'parent') || '');
        return parent && (parent === pid || parent === String(pick(L, 'sku') || ''));
      });
    children.forEach((c) => variationHandled.add(c.idx));
    jobs.push({ kind: 'variable', L, children: children.map((c) => c.L) });
  }

  list.forEach(({ L }, idx) => {
    const type = pick(L, 'type').toLowerCase();
    if (type !== 'variation') return;
    if (variationHandled.has(idx)) return;
    jobs.push({ kind: 'simple', L });
  });

  return jobs;
}

function wooRowToSimplePayload(L) {
  const name = pick(L, 'name');
  const sku = pick(L, 'sku');
  const shortDesc = pick(L, 'short description');
  const description = pick(L, 'description');
  const regular = toNum(pick(L, 'regular price'), 0);
  const saleRaw = pick(L, 'sale price');
  const sale = saleRaw ? toNum(saleRaw, NaN) : NaN;
  const discountPrice = Number.isFinite(sale) && sale > 0 && sale < regular ? sale : null;
  const price = regular;
  const stock = toNum(pick(L, 'stock'), 0);
  const published = pick(L, 'published').toLowerCase();
  const isActive = !['0', 'no', 'false', 'draft', 'private'].includes(published);
  const featured = pick(L, 'is featured?', 'featured').toLowerCase();
  const isFeatured = ['1', 'yes', 'true'].includes(featured);
  const categories = pick(L, 'categories');
  const tagsRaw = pick(L, 'tags');
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];
  const imagesRaw = pick(L, 'images');
  const images = imagesRaw
    ? imagesRaw.split(',').map((u) => u.trim()).map((u) => imageFromUrl(u)).filter(Boolean)
    : [];
  const weightRaw = pick(L, 'weight (kg)', 'weight');
  const weight = weightRaw ? toNum(weightRaw, 0) : null;
  return {
    format: 'woocommerce',
    wooId: pick(L, 'id'),
    name,
    sku,
    shortDesc,
    description,
    price: discountPrice != null ? regular : regular,
    discountPrice,
    stock,
    isActive,
    isFeatured,
    categories,
    tags,
    images,
    weight,
    productType: 'simple',
    variantRows: null,
  };
}

function wooVariablePayload(parentL, childLs) {
  const base = wooRowToSimplePayload(parentL);
  const dimName = 'Variant';
  const options = (childLs || []).map((cL, idx) => {
    const attrParts = [1, 2, 3, 4, 5].map((i) => pick(cL, `attribute ${i} value(s)`, `attribute ${i} value`)).filter(Boolean);
    const label = attrParts.length
      ? attrParts.join(' / ')
      : (pick(cL, 'name') || pick(cL, 'sku') || `Option ${idx + 1}`);
    const regular = toNum(pick(cL, 'regular price'), 0);
    const saleRaw = pick(cL, 'sale price');
    const sale = saleRaw ? toNum(saleRaw, NaN) : NaN;
    const salePrice = Number.isFinite(sale) && sale > 0 && sale < regular ? sale : null;
    return {
      label,
      sku: pick(cL, 'sku'),
      regularPrice: regular,
      salePrice,
      priceModifier: 0,
      stock: toNum(pick(cL, 'stock'), 0),
      images: [],
    };
  });

  return {
    ...base,
    productType: 'variable',
    price: 0,
    basePrice: 0,
    discountPrice: null,
    stock: options.reduce((s, o) => s + toNum(o.stock, 0), 0),
    variantRows: [{ name: dimName, defaultOptionIndex: 0, options }],
    wooId: pick(parentL, 'id'),
  };
}

async function findExistingProduct(payload) {
  if (payload.appId && /^[a-f\d]{24}$/i.test(payload.appId)) {
    const byId = await Product.findById(payload.appId).select('_id').lean();
    if (byId) return Product.findById(byId._id);
  }
  if (payload.wooId) {
    const p = await Product.findOne({ 'integration.woocommerceProductId': String(payload.wooId) });
    if (p) return p;
  }
  if (payload.handle) {
    const slug = makeSlug(payload.handle);
    const bySlug = await Product.findOne({ slug });
    if (bySlug) return bySlug;
    const byInt = await Product.findOne({ 'integration.shopifyHandle': payload.handle.toLowerCase() });
    if (byInt) return byInt;
  }
  if (payload.sku) {
    const bySku = await Product.findOne({ sku: payload.sku });
    if (bySku) return bySku;
    const byVarSku = await Product.findOne({ 'variants.options.sku': payload.sku });
    if (byVarSku) return byVarSku;
  }
  return null;
}

async function saveProductFromPayload(payload, stats) {
  if (!payload.name?.trim()) {
    stats.failed.push({ reason: 'Missing product name', detail: payload.handle || payload.sku || '' });
    return;
  }
  const categoryId = await findCategoryIdByWooOrShopifyPath(
    payload.format === 'shopify' ? payload.type : payload.categories,
  );
  if (!categoryId) {
    stats.failed.push({ reason: 'No category could be resolved; create a category in admin first.', payload: payload.name });
    return;
  }
  const brandId = payload.vendor
    ? await findBrandIdByName(payload.vendor)
    : null;

  const slugBase = payload.handle ? makeSlug(payload.handle) : makeSlug(payload.name);
  const existing = await findExistingProduct(payload);

  const published = String(payload.published || 'true').toLowerCase();
  const isActive = !['false', '0', 'no', 'draft', 'unpublished'].includes(published);

  const integration = {};
  if (payload.wooId) integration.woocommerceProductId = String(payload.wooId);
  if (payload.handle) integration.shopifyHandle = String(payload.handle).toLowerCase();

  const doc = {
    name: payload.name || slugBase,
    description: payload.description || '',
    shortDesc: payload.shortDesc || '',
    category: categoryId,
    brand: brandId || null,
    tags: payload.tags || [],
    sku: payload.sku || undefined,
    weight: payload.weight != null ? toNum(payload.weight, 0) : undefined,
    isActive: payload.isActive !== undefined ? payload.isActive : isActive,
    isFeatured: !!payload.isFeatured,
    images: payload.images?.length ? payload.images : [],
    meta: {
      title: payload.seoTitle || '',
      description: payload.seoDesc || '',
      keywords: [],
    },
  };
  if (Object.keys(integration).length) doc.integration = integration;

  if (payload.productType === 'variable' && payload.variantRows?.length) {
    doc.productType = 'variable';
    doc.basePrice = 0;
    doc.price = 0;
    doc.discountPrice = null;
    doc.variants = payload.variantRows;
    doc.stock = doc.variants.reduce(
      (sum, v) => sum + (v.options || []).reduce((s, o) => s + toNum(o.stock, 0), 0),
      0,
    );
    doc.totalStock = doc.stock;
  } else {
    doc.productType = 'simple';
    doc.price = toNum(payload.price, 0);
    doc.discountPrice = payload.discountPrice != null && payload.discountPrice !== ''
      ? toNum(payload.discountPrice, 0)
      : null;
    doc.stock = toNum(payload.stock, 0);
    doc.totalStock = doc.stock;
    doc.variants = [];
    doc.basePrice = undefined;
  }

  if (existing) {
    const prevInt = existing.integration
      ? (typeof existing.integration.toObject === 'function'
        ? existing.integration.toObject()
        : { ...existing.integration })
      : {};
    const mergedIntegration = {
      ...prevInt,
      ...integration,
    };
    existing.set({
      ...doc,
      slug: existing.slug,
      integration: Object.keys(mergedIntegration).length ? mergedIntegration : existing.integration,
    });
    await existing.save();
    stats.updated += 1;
    return;
  }

  doc.slug = await uniqueSlug(slugBase);
  await Product.create(doc);
  stats.created += 1;
}

/** ── Public: import ───────────────────────────────────────────────────── */
export async function importProductsFromCsv(buffer, format, _filename = 'import.csv') {
  const fmt = format === 'wordpress' ? 'woocommerce' : format;
  if (!['shopify', 'woocommerce'].includes(fmt)) {
    const e = new Error('Invalid format. Use shopify, woocommerce, or wordpress.');
    e.status = 400;
    throw e;
  }
  const records = parseCsvBuffer(buffer);
  if (!records.length) {
    const e = new Error('CSV has no rows.');
    e.status = 400;
    throw e;
  }

  const stats = { created: 0, updated: 0, failed: [] };

  if (fmt === 'shopify') {
    const groups = groupShopifyByHandle(records);
    for (const [, rows] of groups) {
      try {
        const handle = rowKeysLower(rows[0]);
        const h = pick(handle, 'handle').toLowerCase();
        const payload = shopifyRowsToPayload(h, rows);
        // eslint-disable-next-line no-await-in-loop
        await saveProductFromPayload(payload, stats);
      } catch (err) {
        stats.failed.push({ reason: err.message || 'Unknown error', handle: pick(rowKeysLower(rows[0]), 'handle') });
      }
    }
    return stats;
  }

  const wooJobs = groupWooCommerce(records);
  for (const g of wooJobs) {
    try {
      let payload;
      if (g.kind === 'simple') payload = wooRowToSimplePayload(g.L);
      else if (!g.children?.length) payload = wooRowToSimplePayload(g.L);
      else payload = wooVariablePayload(g.L, g.children);
      // eslint-disable-next-line no-await-in-loop
      await saveProductFromPayload(payload, stats);
    } catch (err) {
      stats.failed.push({ reason: err.message || 'Unknown error', name: pick(g.L, 'name') });
    }
  }
  return stats;
}

/** ── Cartesian for multi-dimension variants (export; matches storefront sum) ─ */
function getOptionPricingSnapshot(product, opt) {
  const baseRegular = toNum(product.basePrice ?? product.price, 0);
  const baseSale = product.discountPrice != null && product.discountPrice !== undefined
    ? toNum(product.discountPrice, 0)
    : null;
  const regular = opt?.regularPrice != null && opt.regularPrice !== undefined
    ? toNum(opt.regularPrice, 0)
    : baseRegular + toNum(opt?.priceModifier, 0);
  const sale = opt?.salePrice != null && opt.salePrice !== undefined
    ? toNum(opt.salePrice, 0)
    : (baseSale != null ? baseSale + toNum(opt?.priceModifier, 0) : null);
  return { regular, sale };
}

function cartesianCombinations(product) {
  const dims = product.variants || [];
  if (!dims.length) {
    const regular = toNum(product.price, 0);
    const sale = product.discountPrice != null ? toNum(product.discountPrice, 0) : null;
    return [{
      combo: [],
      sku: product.sku || '',
      stock: toNum(product.stock, 0),
      regular,
      sale: sale < regular ? sale : null,
    }];
  }
  const out = [];
  const walk = (i, acc, skuParts, stockMin) => {
    if (i >= dims.length) {
      const snaps = acc.map(({ opt }) => getOptionPricingSnapshot(product, opt));
      const regular = snaps.reduce((s, x) => s + x.regular, 0);
      const hasSale = snaps.some((x) => x.sale !== null);
      const saleSum = hasSale
        ? snaps.reduce((s, x) => s + (x.sale ?? x.regular), 0)
        : null;
      const sku = skuParts.filter(Boolean).join('-') || '';
      out.push({
        combo: acc,
        sku,
        stock: stockMin === Infinity ? 0 : stockMin,
        regular,
        sale: hasSale ? saleSum : null,
      });
      return;
    }
    const dim = dims[i];
    const opts = dim.options || [];
    for (const opt of opts) {
      const nextStock = Math.min(
        stockMin === Infinity ? toNum(opt.stock, 0) : stockMin,
        toNum(opt.stock, 0),
      );
      walk(i + 1, [...acc, { dim: dim.name, opt }], [...skuParts, opt.sku], nextStock);
    }
  };
  walk(0, [], [], Infinity);
  return out;
}

function buildShopifyCsvRows(product) {
  const handle = product.slug;
  const categoryName = product.category?.name || '';
  const vendor = product.brand?.name || '';
  const tags = (product.tags || []).join(', ');
  const published = product.isActive ? 'TRUE' : 'FALSE';
  const body = product.description || '';
  const title = product.name || '';
  const seoTitle = product.meta?.title || '';
  const seoDesc = product.meta?.description || '';
  const appId = String(product._id);
  const grams = product.weight != null ? Math.round(toNum(product.weight, 0) * 1000) : '';

  const imageRows = (product.images || []).map((img, idx) => ({
    imageSrc: img.url || '',
    imagePos: idx + 1,
    imageAlt: img.alt || title,
  }));
  const firstImage = imageRows[0] || { imageSrc: '', imagePos: '', imageAlt: '' };

  const rows = [];

  if (product.productType !== 'variable' || !product.variants?.length) {
    const regular = toNum(product.price, 0);
    const sale = product.discountPrice != null ? toNum(product.discountPrice, 0) : null;
    const variantPrice = sale != null && sale < regular ? sale : regular;
    const compareAt = sale != null && sale < regular ? String(regular) : '';
    rows.push([
      handle, title, body, vendor, categoryName, tags, published,
      '', '', '', '', '', '', '', '',
      product.sku || '', grams, 'deny', product.stock ?? 0, 'continue', 'manual', 'active',
      String(variantPrice), compareAt, 'TRUE', 'TRUE', '', firstImage.imageSrc, firstImage.imagePos || 1, firstImage.imageAlt,
      'FALSE', seoTitle, seoDesc, appId,
    ]);
    for (let i = 1; i < imageRows.length; i += 1) {
      const im = imageRows[i];
      rows.push([
        handle, '', '', '', '', '', published,
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', im.imageSrc, im.imagePos, im.imageAlt,
        '', '', '', appId,
      ]);
    }
    return rows;
  }

  const combos = cartesianCombinations(product);

  combos.forEach((c, idx) => {
    const opt = c.combo;
    const o1 = opt[0];
    const o2 = opt[1];
    const o3 = opt[2];
    const variantPrice = c.sale != null && c.sale < c.regular ? c.sale : c.regular;
    const compareAt = c.sale != null && c.sale < c.regular ? String(c.regular) : '';
    const im = idx === 0 ? firstImage : { imageSrc: '', imagePos: '', imageAlt: '' };
    if (idx > 0 && imageRows[idx]) {
      Object.assign(im, imageRows[idx]);
    }
    rows.push([
      handle,
      idx === 0 ? title : '',
      idx === 0 ? body : '',
      idx === 0 ? vendor : '',
      idx === 0 ? categoryName : '',
      idx === 0 ? tags : '',
      published,
      o1 ? o1.dim : '',
      o1 ? o1.opt.label : '',
      o2 ? o2.dim : '',
      o2 ? o2.opt.label : '',
      o3 ? o3.dim : '',
      o3 ? o3.opt.label : '',
      c.sku || product.sku || '',
      grams,
      'deny',
      c.stock,
      'continue',
      'manual',
      'active',
      String(variantPrice),
      compareAt,
      'TRUE',
      'TRUE',
      '',
      im.imageSrc,
      im.imagePos || (idx + 1),
      im.imageAlt,
      'FALSE',
      idx === 0 ? seoTitle : '',
      idx === 0 ? seoDesc : '',
      appId,
    ]);
  });

  for (let i = 1; i < imageRows.length; i += 1) {
    const im = imageRows[i];
    rows.push([
      handle, '', '', '', '', '', published,
      '', '', '', '', '', '', '', '',
      '', '', '', '', '', '', '', '', '', '', '', '', '', im.imageSrc, im.imagePos, im.imageAlt,
      '', '', '', appId,
    ]);
  }

  return rows;
}

const SHOPIFY_HEADER = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
  'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
  'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description', 'App Product ID',
];

const WOO_HEADER = [
  'ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog', 'Short description', 'Description',
  'Tax status', 'In stock?', 'Stock', 'Regular price', 'Sale price', 'Categories', 'Tags', 'Images',
  'Parent', 'Attribute 1 name', 'Attribute 1 value(s)', 'Weight (kg)', 'App Product ID',
];

function buildWooCsvRows(product) {
  const cats = product.category?.name || '';
  const tags = (product.tags || []).join(', ');
  const images = (product.images || []).map((i) => i.url).filter(Boolean).join(', ');
  const published = product.isActive ? '1' : '0';
  const featured = product.isFeatured ? '1' : '0';
  const appId = String(product._id);
  const weight = product.weight != null ? String(product.weight) : '';

  const rows = [];
  if (product.productType !== 'variable' || !product.variants?.length) {
    const regular = toNum(product.price, 0);
    const sale = product.discountPrice != null && toNum(product.discountPrice, 0) < regular
      ? String(toNum(product.discountPrice, 0))
      : '';
    rows.push([
      product.integration?.woocommerceProductId || '',
      'simple',
      product.sku || '',
      product.name,
      published,
      featured,
      'visible',
      product.shortDesc || '',
      product.description || '',
      'taxable',
      product.stock > 0 ? '1' : '0',
      String(product.stock ?? 0),
      String(regular),
      sale,
      cats,
      tags,
      images,
      '',
      '',
      '',
      weight,
      appId,
    ]);
    return rows;
  }

  const parentSku = product.sku || product.slug;
  const wooParentId = product.integration?.woocommerceProductId || '';
  rows.push([
    wooParentId,
    'variable',
    parentSku,
    product.name,
    published,
    featured,
    'visible',
    product.shortDesc || '',
    product.description || '',
    'taxable',
    product.stock > 0 ? '1' : '0',
    String(product.stock ?? 0),
    String(toNum(product.basePrice ?? product.price, 0)),
    '',
    cats,
    tags,
    images,
    '',
    '',
    '',
    weight,
    appId,
  ]);

  const combos = cartesianCombinations(product);
  combos.forEach((c, idx) => {
    const label = c.combo.map((x) => x.opt.label).join(' - ');
    const regular = c.regular;
    const sale = c.sale != null && c.sale < regular ? String(c.sale) : '';
    rows.push([
      '',
      'variation',
      c.sku || `${parentSku}-var-${idx + 1}`,
      label,
      published,
      '0',
      'visible',
      '',
      '',
      'taxable',
      c.stock > 0 ? '1' : '0',
      String(c.stock),
      String(regular),
      sale,
      '',
      '',
      '',
      wooParentId || parentSku,
      'Variant',
      label,
      weight,
      appId,
    ]);
  });
  return rows;
}

/** ── Public: export ────────────────────────────────────────────────────── */
export async function exportProductsCsv(format) {
  const fmt = format === 'wordpress' ? 'woocommerce' : format;
  if (!['shopify', 'woocommerce'].includes(fmt)) {
    const e = new Error('Invalid format. Use shopify, woocommerce, or wordpress.');
    e.status = 400;
    throw e;
  }

  const products = await Product.find({})
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  if (fmt === 'shopify') {
    const lines = [SHOPIFY_HEADER.map(csvEscape).join(',')];
    for (const p of products) {
      for (const cells of buildShopifyCsvRows(p)) {
        lines.push(cells.map(csvEscape).join(','));
      }
    }
    return lines.join('\n');
  }

  const lines = [WOO_HEADER.map(csvEscape).join(',')];
  for (const p of products) {
    for (const cells of buildWooCsvRows(p)) {
      lines.push(cells.map(csvEscape).join(','));
    }
  }
  return lines.join('\n');
}
