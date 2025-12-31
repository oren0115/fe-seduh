import api from '../lib/api';
import type {
  ShiftTemplate,
  CreateShiftTemplateData,
  UpdateShiftTemplateData,
} from '@/types/shift.types';

export const shiftTemplateService = {
  getAll: (activeOnly?: boolean) =>
    api.get<ShiftTemplate[]>('/shifts/templates', 
      activeOnly !== undefined 
        ? { params: { activeOnly: activeOnly.toString() } }
        : {}
    ),
  
  getById: (id: string) =>
    api.get<ShiftTemplate>(`/shifts/templates/${id}`),
  
  create: (data: CreateShiftTemplateData) =>
    api.post<ShiftTemplate>('/shifts/templates', data),
  
  update: (id: string, data: UpdateShiftTemplateData) =>
    api.put<ShiftTemplate>(`/shifts/templates/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/shifts/templates/${id}`),
};

