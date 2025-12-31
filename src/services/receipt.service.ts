import api from '../lib/api';
import type { Receipt } from '@/types/receipt.types';

export const receiptService = {
  getReceipt: (transactionId: string) =>
    api.get<Receipt>(`/receipts/${transactionId}`),
  
  getReceiptText: (transactionId: string) =>
    api.get<string>(`/receipts/${transactionId}/text`, {
      responseType: 'text' as any,
    }),
};

