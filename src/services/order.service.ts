import api from '../lib/api';
import type { Order, CreateOrderData, UpdateOrderStatusData, Station, OrderStatus, BaristaOrder } from '../types/order.types';

export const orderService = {
  /**
   * Create orders from transaction (internal use)
   */
  createFromTransaction: (data: CreateOrderData) =>
    api.post<Order[]>('/orders', data),

  /**
   * Get orders by station for KDS
   */
  getByStation: (station: Station, status?: OrderStatus) => {
    const params: any = { station };
    if (status) {
      params.status = status;
    }
    return api.get<Order[]>('/kds/orders', { params });
  },

  /**
   * Get orders for Barista (BAR station only, no price information)
   */
  getForBarista: (status?: OrderStatus) => {
    const params: any = {};
    if (status) {
      params.status = status;
    }
    return api.get<BaristaOrder[]>('/orders', { params });
  },

  /**
   * Update order status (Barista endpoint)
   */
  updateStatus: (orderId: string, data: UpdateOrderStatusData) =>
    api.patch<Order>(`/orders/${orderId}/status`, data),

  /**
   * Update order status (KDS endpoint - legacy)
   */
  updateStatusKDS: (orderId: string, data: UpdateOrderStatusData) =>
    api.patch<Order>(`/kds/orders/${orderId}/status`, data),

  /**
   * Get order by ID
   */
  getById: (orderId: string) =>
    api.get<Order>(`/orders/${orderId}`),

  /**
   * Get orders by transaction ID
   */
  getByTransaction: (transactionId: string) =>
    api.get<Order[]>(`/orders/transaction/${transactionId}`),
};

