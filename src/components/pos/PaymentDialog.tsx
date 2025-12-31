import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, QrCode, Wallet, DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { calculateChange } from '@/utils/calculations';
import { paymentService } from '@/services/payment.service';
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  cart: any[]; // Cart items for creating transaction
  activeShift: any; // Active shift
  onCreateTransaction: (
    cart: any[],
    paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'E-WALLET',
    cashReceived?: number,
    change?: number
  ) => Promise<any>; // Function to create transaction
  onConfirm: (
    paymentMethod: 'CASH' | 'CARD' | 'QRIS' | 'E-WALLET',
    cashReceived?: number,
    change?: number
  ) => void;
  onMidtransPayment: () => void; // Callback for Midtrans payment success
  processing: boolean;
}

// Declare Midtrans Snap type
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
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
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'QRIS' | 'E-WALLET'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [loadingMidtrans, setLoadingMidtrans] = useState(false);
  const [midtransLoaded, setMidtransLoaded] = useState(false);
  const { toast } = useToast();

  // Load Midtrans Snap script
  useEffect(() => {
    if (open && !midtransLoaded) {
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', ''); // Will be set after getting client key
      script.async = true;
      script.onload = async () => {
        try {
          const clientKey = await paymentService.getClientKey();
          script.setAttribute('data-client-key', clientKey);
          setMidtransLoaded(true);
        } catch (error) {
          console.error('Failed to load Midtrans client key:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load payment gateway. Please try again.',
          });
        }
      };
      script.onerror = () => {
        console.error('Failed to load Midtrans Snap script');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load payment gateway script.',
        });
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector('script[src*="midtrans.com/snap"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [open, midtransLoaded, toast]);

  const change = paymentMethod === 'CASH' && cashReceived
    ? calculateChange(parseFloat(cashReceived), total)
    : 0;

  const handleCashPayment = () => {
    if (paymentMethod === 'CASH') {
      const cash = parseFloat(cashReceived);
      onConfirm(paymentMethod, cash, change);
      setCashReceived('');
    }
  };

  const handleMidtransPayment = async () => {
    if (!midtransLoaded || !window.snap) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Payment gateway is not ready. Please wait a moment and try again.',
      });
      return;
    }

    if (!activeShift) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No active shift. Please check in first.',
      });
      return;
    }

    setLoadingMidtrans(true);

    try {
      // Step 1: Create transaction with PENDING status
      const transaction = await onCreateTransaction(
        cart,
        paymentMethod,
        undefined,
        undefined
      );

      if (!transaction || !transaction._id) {
        throw new Error('Failed to create transaction');
      }

      // Step 2: Create payment and get Snap token
      const response = await paymentService.createMidtransPayment({
        transactionId: transaction._id,
        amount: total,
      });

      const snapToken = response.data.snapToken;

      // Step 3: Open Midtrans Snap popup
      window.snap.pay(snapToken, {
        onSuccess: (result: any) => {
          console.log('Payment success:', result);
          toast({
            title: 'Payment Success',
            description: 'Payment completed successfully!',
          });
          // Call callback to handle success
          onMidtransPayment();
          setLoadingMidtrans(false);
        },
        onPending: (result: any) => {
          console.log('Payment pending:', result);
          toast({
            title: 'Payment Pending',
            description: 'Your payment is being processed. Please complete the payment.',
          });
          // Still call callback for pending payments
          onMidtransPayment();
          setLoadingMidtrans(false);
        },
        onError: (result: any) => {
          console.error('Payment error:', result);
          toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: result.message || 'Payment failed. Please try again.',
          });
          setLoadingMidtrans(false);
        },
        onClose: () => {
          console.log('Payment popup closed');
          setLoadingMidtrans(false);
        },
      });
    } catch (error: any) {
      console.error('Failed to process payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to process payment. Please try again.',
      });
      setLoadingMidtrans(false);
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === 'CASH') {
      handleCashPayment();
    } else {
      // For Midtrans payment methods (QRIS, CARD, E-WALLET)
      handleMidtransPayment();
    }
  };

  const isValid = paymentMethod === 'CASH'
    ? cashReceived && parseFloat(cashReceived) >= total
    : midtransLoaded && cart.length > 0 && activeShift; // For Midtrans, need script loaded, cart, and active shift

  const isProcessing = processing || loadingMidtrans;

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
              <Button
                variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setPaymentMethod('CARD')}
                disabled={isProcessing}
              >
                <CreditCard className="h-7 w-7" />
                <span className="font-semibold">Card</span>
              </Button>
              <Button
                variant={paymentMethod === 'E-WALLET' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setPaymentMethod('E-WALLET')}
                disabled={isProcessing}
              >
                <Wallet className="h-7 w-7" />
                <span className="font-semibold">E-Wallet</span>
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
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                  disabled={isProcessing}
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Change:</span>
                    <span className="font-bold text-xl text-green-700 dark:text-green-400">
                      {formatCurrency(change)}
                    </span>
                  </div>
                </div>
              )}
              {cashReceived && parseFloat(cashReceived) < total && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Insufficient amount. Need {formatCurrency(total - parseFloat(cashReceived))} more.
                  </p>
                </div>
              )}
            </div>
          )}

          {(paymentMethod === 'QRIS' || paymentMethod === 'CARD' || paymentMethod === 'E-WALLET') && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {!midtransLoaded ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading payment gateway...
                  </span>
                ) : (
                  'You will be redirected to complete the payment.'
                )}
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
                paymentMethod === 'CASH' ? 'Confirm Payment' : 'Proceed to Payment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
