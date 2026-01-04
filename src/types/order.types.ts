export type Station = 'BAR' | 'KITCHEN';
export type OrderStatus = 'QUEUED' | 'IN_PROGRESS' | 'READY';
export type ProductType = 'DRINK' | 'FOOD';

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
  type: ProductType;
  station: Station;
  notes?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  transactionId: string;
  items: OrderItem[];
  station: Station;
  status: OrderStatus;
  statusHistory?: Array<{
    status: OrderStatus;
    changedAt: string;
    changedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  readyAt?: string;
}

/**
 * Order item view for Barista (without price information)
 */
export interface BaristaOrderItem {
  productId: string;
  productName: string;
  qty: number;
  type: ProductType;
  station: Station;
  notes?: string;
}

/**
 * Order view for Barista (without price information in items)
 */
export interface BaristaOrder {
  _id: string;
  orderNumber: string;
  transactionId: string;
  items: BaristaOrderItem[];
  station: Station;
  status: OrderStatus;
  statusHistory?: Array<{
    status: OrderStatus;
    changedAt: string;
    changedBy?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  readyAt?: string;
}

export interface CreateOrderData {
  transactionId: string;
  items: Array<{
    productId: string;
    productName: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
}

