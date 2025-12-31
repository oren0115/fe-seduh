import api from '../lib/api';
import type { Transaction, CreateTransactionData } from '@/types/transaction.types';

export const transactionService = {
  create: (data: CreateTransactionData) =>
    api.post<Transaction>('/transactions', data),
  
  getAll: (params?: { date?: string; startDate?: string; endDate?: string; status?: string }) =>
    api.get<Transaction[]>('/transactions', { params }),
  
  getById: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`),
  
  sync: (transactions: CreateTransactionData[]) =>
    api.post('/transactions/sync', { transactions }),
};

