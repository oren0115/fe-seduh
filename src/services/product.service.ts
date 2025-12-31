import api from '../lib/api';
import type { Product } from '@/types/product.types';

export const productService = {
  getAll: (params?: { category?: string; isAvailable?: string; search?: string }) =>
    api.get<Product[]>('/products', { params }),
  
  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),
  
  create: (data: FormData) =>
    api.post<Product>('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (id: string, data: FormData) =>
    api.put<Product>(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id: string) =>
    api.delete(`/products/${id}`),
  
  updateInventory: (productId: string, stock: number) =>
    api.patch<Product>(`/products/inventory/${productId}`, { stock }),
  
  getCategories: () =>
    api.get<string[]>('/products/categories'),
};

