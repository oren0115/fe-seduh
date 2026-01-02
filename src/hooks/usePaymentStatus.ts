import { useState, useEffect, useCallback } from 'react';
import { paymentService } from '@/services/payment.service';
import { transactionService } from '@/services/transaction.service';
import type { Payment } from '@/services/payment.service';
import type { Transaction } from '@/types/transaction.types';

/**
 * Hook untuk polling payment status untuk pending payments
 */
export function usePaymentStatus(transactionId: string | null, enabled: boolean = true) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkStatus = useCallback(async () => {
    if (!transactionId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Check payment status
      try {
        const paymentData = await paymentService.getPaymentByTransactionId(transactionId);
        setPayment(paymentData);
      } catch (err: any) {
        // Payment might not exist yet, that's okay
        if (err.response?.status !== 404) {
          console.warn('[PAYMENT STATUS] Error fetching payment:', err);
        }
      }

      // Check transaction status
      try {
        const response = await transactionService.getById(transactionId);
        setTransaction(response.data);
      } catch (err: any) {
        console.warn('[PAYMENT STATUS] Error fetching transaction:', err);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [transactionId, enabled]);

  useEffect(() => {
    if (!transactionId || !enabled) return;

    // Initial check
    checkStatus();

    // Poll every 3 seconds if payment is still pending
    const interval = setInterval(() => {
      checkStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [transactionId, enabled, checkStatus]);

  return {
    payment,
    transaction,
    loading,
    error,
    isPending: payment?.status === 'PENDING' || transaction?.status === 'PENDING',
    isPaid: payment?.status === 'PAID' || transaction?.status === 'SYNCED' || transaction?.status === 'PAID',
    isFailed: payment?.status === 'FAILED' || payment?.status === 'EXPIRED' || transaction?.status === 'FAILED' || transaction?.status === 'EXPIRED',
    refresh: checkStatus,
  };
}

