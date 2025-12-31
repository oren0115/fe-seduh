import api from '../lib/api';
import type {
  LeaveRequest,
  CreateLeaveRequestData,
} from '@/types/leave-request.types';

export const leaveRequestService = {
  getAll: (params?: {
    userId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    type?: 'SICK' | 'PERMISSION' | 'ANNUAL';
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<LeaveRequest[]>('/leaves', { params }),
  
  getMy: () =>
    api.get<LeaveRequest[]>('/leaves/my'),
  
  getById: (id: string) =>
    api.get<LeaveRequest>(`/leaves/${id}`),
  
  create: (data: CreateLeaveRequestData) =>
    api.post<LeaveRequest>('/leaves', data),
  
  approve: (id: string) =>
    api.patch<LeaveRequest>(`/leaves/${id}/approve`, { status: 'APPROVED' }),
  
  reject: (id: string, rejectionReason: string) =>
    api.patch<LeaveRequest>(`/leaves/${id}/reject`, { rejectionReason }),
  
  delete: (id: string) =>
    api.delete(`/leaves/${id}`),
};

