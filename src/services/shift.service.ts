import api from '../lib/api';
import type {
  Shift,
  CheckInResult,
  CheckOutResult,
  CreateShiftData,
  CreateBulkShiftsData,
  BulkShiftsResult,
  UpdateShiftData,
} from '@/types/shift.types';

export const shiftService = {
  getAll: (params?: {
    userId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) =>
    api.get<Shift[]>('/shifts', { params }),
  
  getById: (id: string) =>
    api.get<Shift>(`/shifts/${id}`),
  
  getActive: () =>
    api.get<Shift | null>('/shifts/active/me'),
  
  checkIn: (shiftId?: string) =>
    shiftId 
      ? api.post<CheckInResult>(`/shifts/${shiftId}/checkin`)
      : api.post<CheckInResult>('/shifts/checkin'),
  
  checkOut: (shiftId?: string) =>
    shiftId
      ? api.post<CheckOutResult>(`/shifts/${shiftId}/checkout`)
      : api.post<CheckOutResult>('/shifts/checkout'),
  
  create: (data: CreateShiftData) =>
    api.post<Shift>('/shifts', data),
  
  createBulk: (data: CreateBulkShiftsData) =>
    api.post<BulkShiftsResult>('/shifts/bulk', data),
  
  update: (id: string, data: UpdateShiftData) =>
    api.put<Shift>(`/shifts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/shifts/${id}`),
};

