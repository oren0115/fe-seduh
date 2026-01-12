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
  
  create: (data: CreateLeaveRequestData, file?: File) => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);
    if (file) {
      formData.append('attachment', file);
    }
    return api.post<LeaveRequest>('/leaves', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  approve: (id: string) =>
    api.patch<LeaveRequest>(`/leaves/${id}/approve`, { status: 'APPROVED' }),
  
  reject: (id: string, rejectionReason: string) =>
    api.patch<LeaveRequest>(`/leaves/${id}/reject`, { rejectionReason }),
  
  delete: (id: string) =>
    api.delete(`/leaves/${id}`),
};

