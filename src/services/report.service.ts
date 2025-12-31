import api from '../lib/api';
import type { DailyReport, MonthlyReport, BestSeller } from '@/types/report.types';

export const reportService = {
  getDaily: (date?: string) =>
    api.get<DailyReport>('/reports/daily', { params: { date } }),
  
  getMonthly: (year?: number, month?: number) =>
    api.get<MonthlyReport>('/reports/monthly', { params: { year, month } }),
  
  getBestSellers: (limit?: number, startDate?: string, endDate?: string) =>
    api.get<BestSeller[]>('/reports/best-seller', {
      params: { limit, startDate, endDate },
    }),
};

