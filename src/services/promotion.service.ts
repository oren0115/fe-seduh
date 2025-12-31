import api from '../lib/api';
import type {
  Promotion,
  CreatePromotionData,
  ApplyPromotionData,
  PromotionResult,
} from '@/types/promotion.types';

export const promotionService = {
  getAll: (params?: { isActive?: boolean; date?: string; productId?: string; categoryId?: string }) =>
    api.get<Promotion[]>('/promotions', { params }),
  
  getById: (id: string) =>
    api.get<Promotion>(`/promotions/${id}`),
  
  getActive: (date?: string) =>
    api.get<Promotion[]>('/promotions/active', { params: date ? { date } : {} }),
  
  apply: (data: ApplyPromotionData) =>
    api.post<PromotionResult>('/promotions/apply', data),
  
  create: (data: CreatePromotionData) =>
    api.post<Promotion>('/promotions', data),
  
  update: (id: string, data: Partial<CreatePromotionData>) =>
    api.put<Promotion>(`/promotions/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/promotions/${id}`),
};

