import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { calculateChange } from '@/utils/calculations';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (
    paymentMethod: 'CASH',
    cashReceived?: number,
    change?: number
  ) => void;
  processing: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
  processing,
}: PaymentDialogProps) {
  const [cashReceived, setCashReceived] = useState('');

  // Calculate change for cash payment
  const cashReceivedNum = cashReceived ? parseFloat(cashReceived) : 0;
  const change = cashReceivedNum > 0
    ? calculateChange(cashReceivedNum, total)
    : 0;

  const handleCashPayment = () => {
    if (cashReceivedNum >= total) {
      onConfirm('CASH', cashReceivedNum, change);
      setCashReceived('');
    }
  };

  const isValid = cashReceivedNum > 0 && cashReceivedNum >= total;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Complete transaction with cash payment
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Cash Received</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={cashReceived}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty, numbers, and decimal
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setCashReceived(value);
                  }
                }}
                className="text-lg font-semibold"
                autoFocus
                disabled={processing}
                min={0}
                step="1000"
              />
              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceived(total.toString())}
                  disabled={processing}
                  className="text-xs"
                >
                  Exact
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceived((total + 5000).toString())}
                  disabled={processing}
                  className="text-xs"
                >
                  +5K
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceived((total + 10000).toString())}
                  disabled={processing}
                  className="text-xs"
                >
                  +10K
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceived((total + 20000).toString())}
                  disabled={processing}
                  className="text-xs"
                >
                  +20K
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceived((total + 50000).toString())}
                  disabled={processing}
                  className="text-xs"
                >
                  +50K
                </Button>
              </div>
            </div>
            
            {/* Change display */}
            {cashReceivedNum > 0 && cashReceivedNum >= total && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Change:</span>
                  <span className="font-bold text-xl text-green-700 dark:text-green-400">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Insufficient amount warning */}
            {cashReceivedNum > 0 && cashReceivedNum < total && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Insufficient amount. Need {formatCurrency(total - cashReceivedNum)} more.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCashPayment}
              disabled={processing || !isValid}
              size="lg"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
