import api from './api';

export const productService = {
  getAll:     (params) => api.get('/products', { params }).then(r => r.data.data),
  getFeatured:(params) => api.get('/products/featured', { params }).then(r => r.data.data),
  getBySlug:  (slug)   => api.get(`/products/slug/${slug}`).then(r => r.data.data),
  getRelated: (slug)   => api.get(`/products/slug/${slug}/related`).then(r => r.data.data),
};

export const categoryService = {
  getAll: () => api.get('/categories').then(r => r.data.data),
};

export const brandService = {
  getAll: () => api.get('/brands').then(r => r.data.data),
};