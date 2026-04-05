import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productService, categoryService, brandService } from '../services/productService';

export const useProducts = (params = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn:  () => productService.getAll(params),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

export const useFeaturedProducts = (limit = 8) =>
  useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn:  () => productService.getFeatured({ limit }),
    staleTime: 1000 * 60 * 5,
  });

export const useProduct = (slug) =>
  useQuery({
    queryKey: ['product', slug],
    queryFn:  () => productService.getBySlug(slug),
    enabled:  !!slug,
    staleTime: 1000 * 60 * 5,
  });

export const useRelatedProducts = (slug) =>
  useQuery({
    queryKey: ['products', 'related', slug],
    queryFn:  () => productService.getRelated(slug),
    enabled:  !!slug,
  });

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn:  categoryService.getAll,
    staleTime: 1000 * 60 * 10,
  });

export const useBrands = () =>
  useQuery({
    queryKey: ['brands'],
    queryFn:  brandService.getAll,
    staleTime: 1000 * 60 * 10,
  });