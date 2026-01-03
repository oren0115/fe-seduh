import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import type { Transaction } from '@/types/transaction.types';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  userName?: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: 'CASH';
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none">
        <div className="print:p-8">
          {/* Header */}
          <div className="text-center mb-6 print:mb-4">
            <h2 className="text-2xl font-bold mb-2">Coffee Shop POS</h2>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(transaction.createdAt)}
            </p>
            <p className="text-sm text-muted-foreground">
              Transaction #{transaction.transactionNumber}
            </p>
            {userName && (
              <p className="text-sm text-muted-foreground mt-1">
                Cashier: {userName}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b py-4 mb-4 print:py-2">
            {transaction.items.map((item, index) => (
              <div key={index} className="flex justify-between mb-3 print:mb-2 last:mb-0">
                <div className="flex-1">
                  <div className="font-semibold">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} × {item.qty}
                  </div>
                </div>
                <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-4">
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
              <span>{paymentMethod}</span>
            </div>
            {cashReceived !== undefined && (
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
            Save as PDF
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
