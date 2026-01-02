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
  qrString?: string; // QRIS QR string
  midtransResponse?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRISPaymentResponse {
  success: boolean;
  data: {
    payment: {
      _id: string;
      transactionId: string;
      orderId: string;
      amount: number;
      method: 'CASH' | 'MIDTRANS';
      status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
      qrString?: string;
      createdAt: string;
      updatedAt: string;
    };
    qrString: string;
    transactionId: string;
    orderId: string;
    expiresAt?: string | null;
  };
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
    const response = await api.post<{ success: boolean; data: CreatePaymentResponse['data'] }>('/payments/midtrans', data);
    
    // Backend returns: { success: true, data: { payment: {...}, snapToken: "..." } }
    // Axios wraps: response.data = { success: true, data: { payment: {...}, snapToken: "..." } }
    // So we need: response.data.data
    const responseData = response.data.data || response.data;
    
    // CRITICAL: Validate snapToken exists
    if (!responseData.snapToken) {
      console.error('[PAYMENT SERVICE] snapToken is missing from response!');
      console.error('[PAYMENT SERVICE] Full response:', JSON.stringify(response.data, null, 2));
      throw new Error('snapToken is required but missing from backend response');
    }
    
    console.log('[PAYMENT SERVICE] Snap token received (length):', responseData.snapToken.length);
    console.log('[PAYMENT SERVICE] Snap token preview:', responseData.snapToken.substring(0, 30) + '...');
    
    return {
      success: true,
      data: responseData,
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
   * Create QRIS payment using Core API (custom QR display)
   * Returns QR string for custom popup
   */
  createQRISPayment: async (data: CreatePaymentRequest): Promise<CreateQRISPaymentResponse> => {
    const response = await api.post<{ success: boolean; data: CreateQRISPaymentResponse['data'] }>('/payments/qris', data);
    
    // Backend returns: { success: true, data: { payment: {...}, qrString: "...", ... } }
    // Axios wraps: response.data = { success: true, data: { payment: {...}, qrString: "...", ... } }
    const responseData = response.data.data || response.data;
    
    // CRITICAL: Validate qrString exists
    if (!responseData.qrString || responseData.qrString.trim() === '') {
      console.error('[PAYMENT SERVICE] QR string is missing from response!');
      console.error('[PAYMENT SERVICE] Full response:', JSON.stringify(response.data, null, 2));
      throw new Error('QR string is required but missing from backend response');
    }
    
    console.log('[PAYMENT SERVICE] QRIS payment created successfully');
    console.log('[PAYMENT SERVICE] QR string received (length):', responseData.qrString.length);
    console.log('[PAYMENT SERVICE] Transaction ID:', responseData.transactionId);
    console.log('[PAYMENT SERVICE] Order ID:', responseData.orderId);
    
    return {
      success: true,
      data: responseData,
    };
  },

  /**
   * Get Midtrans client key for frontend
   */
  getClientKey: async (): Promise<string> => {
    const response = await api.get<ClientKeyResponse>('/payments/client-key');
    // Backend returns: { success: true, data: { clientKey: "..." } }
    // Axios wraps it: response.data = { success: true, data: { clientKey: "..." } }
    const clientKey = response.data.data?.clientKey;
    
    if (!clientKey || clientKey.trim() === '') {
      console.error('[PAYMENT SERVICE] Client key is empty or missing');
      console.error('[PAYMENT SERVICE] Full response:', JSON.stringify(response.data, null, 2));
      throw new Error('Client key not found in response. Please check backend configuration.');
    }
    
    console.log('[PAYMENT SERVICE] Client key retrieved successfully (length):', clientKey.length);
    return clientKey;
  },
};

