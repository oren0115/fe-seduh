import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer, Download } from 'lucide-react';
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
  paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'E-WALLET';
  cashReceived?: number;
  change?: number;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  transaction,
  userName,
  subtotal,
  discountTotal,
  total,
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
              <span>{paymentMethod}</span>
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

