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
  paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'E-WALLET';
  cashReceived?: number;
  change?: number;
  status: 'LOCAL' | 'SYNCED' | 'PENDING';
  syncedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  items: TransactionItem[];
  paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'E-WALLET';
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

