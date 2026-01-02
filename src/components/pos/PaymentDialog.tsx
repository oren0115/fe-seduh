import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { calculateChange } from '@/utils/calculations';
import { paymentService } from '@/services/payment.service';
import { useToast } from '@/hooks/use-toast';
import { QRISDialog } from './QRISDialog';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cart: any[]; // Cart items for creating transaction
  activeShift: any; // Active shift
  onCreateTransaction: (
    cart: any[],
    paymentMethod: 'CASH' | 'QRIS',
    cashReceived?: number,
    change?: number
  ) => Promise<any>; // Function to create transaction
  onConfirm: (
    paymentMethod: 'CASH' | 'QRIS',
    cashReceived?: number,
    change?: number
  ) => void;
  onMidtransPayment: () => void; // Callback for QRIS payment success
  processing: boolean;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  cart,
  activeShift,
  onCreateTransaction,
  onConfirm,
  onMidtransPayment,
  processing,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [loadingQRIS, setLoadingQRIS] = useState(false);
  const [qrisDialogOpen, setQrisDialogOpen] = useState(false);
  const [qrisData, setQrisData] = useState<{
    qrString: string;
    orderId: string;
    transactionId: string;
    expiresAt?: string | null;
  } | null>(null);
  const { toast } = useToast();

  // Debug: Log when QRIS dialog state changes
  useEffect(() => {
    if (qrisData) {
      console.log('[PAYMENT DIALOG] QRIS data set:', {
        hasQrString: !!qrisData.qrString,
        orderId: qrisData.orderId,
        transactionId: qrisData.transactionId,
        dialogOpen: qrisDialogOpen,
      });
    }
  }, [qrisData, qrisDialogOpen]);

  // Calculate change for cash payment
  const cashReceivedNum = cashReceived ? parseFloat(cashReceived) : 0;
  const change = paymentMethod === 'CASH' && cashReceivedNum > 0
    ? calculateChange(cashReceivedNum, total)
    : 0;

  const handleCashPayment = () => {
    if (paymentMethod === 'CASH' && cashReceivedNum >= total) {
      onConfirm(paymentMethod, cashReceivedNum, change);
      setCashReceived('');
    }
  };

  const handleQRISPayment = async () => {
    if (!activeShift) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No active shift. Please check in first.',
      });
      return;
    }

    setLoadingQRIS(true);

    try {
      // Step 1: Create transaction with PENDING status
      const transaction = await onCreateTransaction(
        cart,
        'QRIS',
        undefined,
        undefined
      );

      if (!transaction || !transaction._id) {
        throw new Error('Failed to create transaction');
      }

      // Step 2: Create QRIS payment and get QR string
      const response = await paymentService.createQRISPayment({
        transactionId: transaction._id,
        amount: total,
      });

      const { qrString, transactionId, orderId, expiresAt } = response.data;

      if (!qrString || qrString.trim() === '') {
        throw new Error('QR string is required but not received from backend');
      }

      console.log('[PAYMENT] QRIS payment created successfully');
      console.log('[PAYMENT] QR string length:', qrString.length);
      console.log('[PAYMENT] Transaction ID:', transactionId);

      // Step 3: Open QRIS custom dialog
      console.log('[PAYMENT] Setting QRIS dialog data:', {
        qrString: qrString.substring(0, 30) + '...',
        orderId,
        transactionId,
        expiresAt,
      });
      setQrisData({
        qrString,
        orderId,
        transactionId,
        expiresAt,
      });
      setQrisDialogOpen(true);
      console.log('[PAYMENT] QRIS dialog should be open now');
      onOpenChange(false); // Close payment method selection
      setLoadingQRIS(false);
    } catch (error: any) {
      console.error('[PAYMENT] Failed to process QRIS payment:', error);
      
      if (error.response?.status === 401) {
        const { authService } = await import('@/lib/auth');
        const expiryTime = authService.getTokenExpiryTime();
        const isTokenExpired = expiryTime !== null && expiryTime <= 0;
        
        if (isTokenExpired) {
          toast({
            variant: 'destructive',
            title: 'Session Expired',
            description: 'Your session has expired. Please refresh the page and login again.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: error.response?.data?.error || 'Authentication failed. Please check backend logs.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: error.response?.data?.error || error.message || 'Failed to process QRIS payment. Please try again.',
        });
      }
      setLoadingQRIS(false);
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === 'CASH') {
      handleCashPayment();
    } else if (paymentMethod === 'QRIS') {
      // Use custom QRIS flow (Core API, not Snap)
      handleQRISPayment();
    }
  };

  const isValid = paymentMethod === 'CASH'
    ? cashReceivedNum > 0 && cashReceivedNum >= total
    : cart.length > 0 && activeShift; // QRIS validation

  const isProcessing = processing || loadingQRIS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Select payment method and complete transaction
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setPaymentMethod('CASH')}
                disabled={isProcessing}
              >
                <DollarSign className="h-7 w-7" />
                <span className="font-semibold">Cash</span>
              </Button>
              <Button
                variant={paymentMethod === 'QRIS' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setPaymentMethod('QRIS')}
                disabled={isProcessing}
              >
                <QrCode className="h-7 w-7" />
                <span className="font-semibold">QRIS</span>
              </Button>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
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
                  disabled={isProcessing}
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
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    Exact
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived((total + 5000).toString())}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    +5K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived((total + 10000).toString())}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    +10K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived((total + 20000).toString())}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    +20K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived((total + 50000).toString())}
                    disabled={isProcessing}
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
          )}

          {paymentMethod === 'QRIS' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                QR Code akan ditampilkan untuk di-scan customer
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isProcessing || !isValid}
              size="lg"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                paymentMethod === 'CASH' ? 'Confirm Payment' : 'Proceed to QRIS'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* QRIS Custom Dialog */}
      {qrisData && (
        <QRISDialog
          open={qrisDialogOpen}
          onOpenChange={setQrisDialogOpen}
          qrString={qrisData.qrString}
          amount={total}
          orderId={qrisData.orderId}
          transactionId={qrisData.transactionId}
          expiresAt={qrisData.expiresAt}
          onPaymentSuccess={() => {
            onMidtransPayment();
            setQrisData(null);
          }}
          onPaymentFailed={() => {
            setQrisData(null);
          }}
        />
      )}
    </Dialog>
  );
}
