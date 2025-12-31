import type { CartItem } from '@/types/transaction.types';

export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

export function calculateTotal(subtotal: number, discountTotal: number): number {
  return Math.max(0, subtotal - discountTotal);
}

export function calculateChange(cashReceived: number, total: number): number {
  return Math.max(0, cashReceived - total);
}

