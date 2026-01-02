export interface TransactionItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  _id: string;
  transactionNumber: string;
  items: TransactionItem[];
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'MIDTRANS'; // MIDTRANS for backend, CASH/QRIS for frontend
  cashReceived?: number;
  change?: number;
  status: 'LOCAL' | 'SYNCED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELED';
  syncedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  items: TransactionItem[];
  paymentMethod: 'CASH' | 'QRIS' | 'MIDTRANS'; // MIDTRANS for backend, CASH/QRIS for frontend
  cashReceived?: number;
  change?: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  qty: number;
  subtotal: number;
}

