import { useState, useCallback } from 'react';
import { transactionService } from '@/services/transaction.service';
import type { Transaction, CreateTransactionData, CartItem } from '@/types/transaction.types';
import type { Shift } from '@/types/shift.types';
import { useToast } from '@/hooks/use-toast';

export function useTransactions() {
  const [processing, setProcessing] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  const createTransaction = useCallback(async (
    cart: CartItem[],
    paymentMethod: 'CASH',
    cashReceived?: number,
    change?: number,
    activeShift?: Shift | null
  ) => {
    // Validate active shift
    if (!activeShift) {
      toast({
        variant: 'destructive',
        title: 'No Active Shift',
        description: 'Please check in to your shift before processing transactions',
      });
      return null;
    }

    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart Empty',
        description: 'Please add items to cart',
      });
      return null;
    }

    // Note: Cash payment validation (cashReceived >= total) is already done in PaymentDialog
    // Backend will also validate the transaction data
    try {
      setProcessing(true);
      const transactionData: CreateTransactionData = {
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
        })),
        paymentMethod,
        ...(paymentMethod === 'CASH' && {
          cashReceived: cashReceived!,
          change: change || 0,
        }),
      };

      const response = await transactionService.create(transactionData);
      setCompletedTransaction(response.data);
      
      toast({
        title: 'Success',
        description: 'Transaction completed successfully',
      });
      
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to process transaction',
      });
      return null;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const clearCompletedTransaction = useCallback(() => {
    setCompletedTransaction(null);
  }, []);

  return {
    processing,
    completedTransaction,
    createTransaction,
    clearCompletedTransaction,
  };
}

