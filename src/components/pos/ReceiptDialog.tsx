import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer, Download, Loader2, AlertCircle } from 'lucide-react';
import type { Transaction } from '@/types/transaction.types';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { Badge } from '@/components/ui/badge';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  userName?: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: 'CASH' | 'QRIS' | 'MIDTRANS';
  cashReceived?: number;
  change?: number;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  transaction,
  userName,
  subtotal: propSubtotal,
  discountTotal: propDiscountTotal,
  total: propTotal,
  paymentMethod,
  cashReceived,
  change,
}: ReceiptDialogProps) {
  // Poll payment status if transaction is pending and payment method is Midtrans
  const isMidtransPayment = ['QRIS', 'MIDTRANS'].includes(paymentMethod);
  const { payment, isPending, isPaid, isFailed } = usePaymentStatus(
    transaction?._id || null,
    open && isMidtransPayment && transaction?.status === 'PENDING'
  );

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleSavePDF = () => {
    window.print();
  };

  if (!transaction) return null;

  // Calculate subtotal from transaction items (source of truth)
  const calculatedSubtotal = transaction.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Use transaction total as source of truth, fallback to calculated if needed
  const displayTotal = transaction.total || calculatedSubtotal;
  
  // Calculate discount (if any) - difference between subtotal and total
  const calculatedDiscount = calculatedSubtotal - displayTotal;
  
  // Use calculated values if props are 0 (cart already cleared)
  const subtotal = propSubtotal > 0 ? propSubtotal : calculatedSubtotal;
  const discountTotal = propDiscountTotal > 0 ? propDiscountTotal : (calculatedDiscount > 0 ? calculatedDiscount : 0);
  const total = propTotal > 0 ? propTotal : displayTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md print:max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Transaction Successful
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 print:space-y-2">
          <div className="text-center border-b pb-4 print:border-b-2">
            <h2 className="text-xl font-bold">Coffee Shop POS</h2>
            <p className="text-sm text-muted-foreground">Receipt</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction #:</span>
              <span className="font-medium">{transaction.transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDateTime(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cashier:</span>
              <span>{userName}</span>
            </div>
          </div>
          <div className="border-t pt-2 space-y-1">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.qty} × {formatCurrency(item.price)}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount:</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2">
              <span className="text-muted-foreground">Payment:</span>
              <div className="flex items-center gap-2">
                <span>
                  {paymentMethod === 'MIDTRANS' && payment?.midtransResponse?.paymentType
                    ? payment.midtransResponse.paymentType
                    : paymentMethod}
                </span>
                {isMidtransPayment && (
                  <>
                    {isPending && (
                      <Badge variant="outline" className="text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Pending
                      </Badge>
                    )}
                    {isPaid && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    )}
                    {isFailed && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
            {paymentMethod === 'CASH' && cashReceived !== undefined && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Received:</span>
                  <span>{formatCurrency(cashReceived)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Change:</span>
                  <span>{formatCurrency(change || 0)}</span>
                </div>
              </>
            )}
            {isMidtransPayment && payment && (
              <>
                {payment.orderId && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Order ID:</span>
                    <span className="font-mono">{payment.orderId}</span>
                  </div>
                )}
                {payment.midtransResponse?.transactionId && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Transaction ID:</span>
                    <span className="font-mono">{payment.midtransResponse.transactionId.substring(0, 20)}...</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="text-center pt-4 border-t print:pt-2">
            <p className="text-xs text-muted-foreground">Thank you for your purchase!</p>
          </div>
        </div>
        <div className="flex gap-2 pt-4 print:hidden">
          <Button variant="outline" className="flex-1" onClick={handlePrintReceipt}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleSavePDF}>
            <Download className="h-4 w-4 mr-2" />
            Save PDF
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

