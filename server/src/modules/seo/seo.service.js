import { Product }  from '../product/product.model.js';
import { Category } from '../category/category.model.js';
import { Blog }     from '../blog/blog.model.js';
import { Settings } from '../settings/settings.model.js';

export const getSeoSettings = async () => {
  const [siteName, siteDesc, siteKeywords, siteUrl, favicon, ogImage] = await Promise.all([
    Settings.findOne({ key: 'siteName'    }),
    Settings.findOne({ key: 'siteDesc'   }),
    Settings.findOne({ key: 'siteKeywords'}),
    Settings.findOne({ key: 'siteUrl'    }),
    Settings.findOne({ key: 'favicon'    }),
    Settings.findOne({ key: 'ogImage'    }),
  ]);
  return {
    siteName:    siteName?.value    || 'My Shop',
    siteDesc:    siteDesc?.value    || 'Best products at best prices',
    siteKeywords:siteKeywords?.value|| 'shop, ecommerce, bangladesh',
    siteUrl:     siteUrl?.value     || 'https://myshop.com',
    favicon:     favicon?.value     || '/favicon.ico',
    ogImage:     ogImage?.value     || '',
  };
};

export const updateSeoSettings = async (data) => {
  const ops = Object.entries(data).map(([key, value]) =>
    Settings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
  );
  await Promise.all(ops);
  return getSeoSettings();
};

export const generateSitemap = async () => {
  const seo      = await getSeoSettings();
  const base     = seo.siteUrl.replace(/\/$/, '');
  const now      = new Date().toISOString();

  const [products, categories, blogs] = await Promise.all([
    Product.find({ isActive: true }).select('slug updatedAt').lean(),
    Category.find({ isActive: true }).select('slug updatedAt').lean(),
    Blog.find({ isPublished: true }).select('slug updatedAt').lean(),
  ]);

  const staticUrls = ['', '/shop', '/cart', '/contact', '/blog'].map(path => ({
    loc: `${base}${path}`, lastmod: now, changefreq: 'weekly', priority: path === '' ? '1.0' : '0.8',
  }));

  const productUrls = products.map(p => ({
    loc: `${base}/product/${p.slug}`,
    lastmod: p.updatedAt?.toISOString() || now,
    changefreq: 'weekly', priority: '0.7',
  }));

  const categoryUrls = categories.map(c => ({
    loc: `${base}/shop?category=${c.slug}`,
    lastmod: c.updatedAt?.toISOString() || now,
    changefreq: 'monthly', priority: '0.6',
  }));

  const blogUrls = blogs.map(b => ({
    loc: `${base}/blog/${b.slug}`,
    lastmod: b.updatedAt?.toISOString() || now,
    changefreq: 'monthly', priority: '0.5',
  }));

  const allUrls = [...staticUrls, ...productUrls, ...categoryUrls, ...blogUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};