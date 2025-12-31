import api from '../lib/api';
import type { Holiday, CreateHolidayData, UpdateHolidayData } from '@/types/holiday.types';

export const holidayService = {
  getAll: (params?: {
    year?: string;
    month?: string;
    type?: 'NATIONAL' | 'STORE';
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<Holiday[]>('/holidays', { params }),
  
  getById: (id: string) =>
    api.get<Holiday>(`/holidays/${id}`),
  
  create: (data: CreateHolidayData) =>
    api.post<Holiday>('/holidays', data),
  
  update: (id: string, data: UpdateHolidayData) =>
    api.put<Holiday>(`/holidays/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/holidays/${id}`),
};

