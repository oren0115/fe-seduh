import api from '../lib/api';
import type { Attendance, AttendanceSummary } from '@/types/attendance.types';

export const attendanceService = {
  getAll: (params?: { date?: string; startDate?: string; endDate?: string; userId?: string }) =>
    api.get<Attendance[]>('/attendance', { params }),
  
  getSummary: (userId: string, startDate: string, endDate: string) =>
    api.get<AttendanceSummary>('/attendance/summary', {
      params: { userId, startDate, endDate },
    }),
};

