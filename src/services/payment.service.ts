/**
 * @fileoverview Payment service.
 * 
 * @module services/payment.service
 */

import api from '@/lib/api';

export interface Payment {
  _id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  method: 'CASH';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export const paymentService = {
  /**
   * Get payment by transaction ID
   */
  getPaymentByTransactionId: async (transactionId: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/transaction/${transactionId}`);
    return response.data;
  },

  /**
   * Get payment by ID
   */
  getPaymentById: async (paymentId: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  },
};
