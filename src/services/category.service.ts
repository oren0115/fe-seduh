import api from '../lib/api';
import type { Category, CreateCategoryData, UpdateCategoryData } from '@/types/category.types';

export const categoryService = {
  getAll: (activeOnly?: boolean) =>
    api.get<Category[]>('/products/categories',
      activeOnly !== undefined
        ? { params: { activeOnly: 'true' } }
        : {}
    ),

  getById: (id: string) =>
    api.get<Category>(`/products/categories/${id}`),

  create: (data: CreateCategoryData) =>
    api.post<Category>('/products/categories', data),

  update: (id: string, data: UpdateCategoryData) =>
    api.put<Category>(`/products/categories/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/categories/${id}`),
};

