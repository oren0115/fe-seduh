export type Station = 'BAR' | 'KITCHEN';
export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY';
export type ProductType = 'DRINK' | 'FOOD';

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
  type: ProductType;
  station: Station;
}

export interface Order {
  _id: string;
  orderNumber: string;
  transactionId: string;
  items: OrderItem[];
  station: Station;
  status: OrderStatus;
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

