import type { Transaction } from './transaction.types';

export interface Receipt {
  transaction: Transaction;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  formattedText?: string;
}

