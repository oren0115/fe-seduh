/**
 * @fileoverview Payment service for Midtrans integration.
 * 
 * @module services/payment.service
 */

import api from '@/lib/api';

export interface CreatePaymentRequest {
  transactionId: string;
  amount: number;
}

export interface CreatePaymentResponse {
  success: boolean;
  data: {
    payment: {
      _id: string;
      transactionId: string;
      orderId: string;
      amount: number;
      method: 'CASH' | 'MIDTRANS';
      status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
      snapToken?: string;
      createdAt: string;
      updatedAt: string;
    };
    snapToken: string;
  };
}

export interface Payment {
  _id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  method: 'CASH' | 'MIDTRANS';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  snapToken?: string;
  midtransResponse?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ClientKeyResponse {
  success: boolean;
  data: {
    clientKey: string;
  };
}

export const paymentService = {
  /**
   * Create payment and get Snap token for Midtrans
   */
  createMidtransPayment: async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await api.post<CreatePaymentResponse['data']>('/payments/midtrans', data);
    return {
      success: true,
      data: response.data,
    };
  },

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

  /**
   * Get Midtrans client key for frontend
   */
  getClientKey: async (): Promise<string> => {
    const response = await api.get<ClientKeyResponse['data']>('/payments/client-key');
    return response.data.clientKey;
  },
};

