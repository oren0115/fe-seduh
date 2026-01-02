import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';
import { QrCode, Loader2, CheckCircle2, XCircle, Clock, Copy, RefreshCw, X } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface QRISDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrString: string;
  amount: number;
  orderId: string;
  transactionId: string;
  expiresAt?: string | null;
  onPaymentSuccess: () => void;
  onPaymentFailed: () => void;
}

export function QRISDialog({
  open,
  onOpenChange,
  qrString,
  amount,
  orderId,
  transactionId,
  expiresAt,
  onPaymentSuccess,
  onPaymentFailed,
}: QRISDialogProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [initialCountdown, setInitialCountdown] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);
  const { toast } = useToast();

  // Poll payment status
  const { isPending, isPaid, isFailed, refresh } = usePaymentStatus(
    transactionId,
    open
  );

  // Store refresh function in ref to avoid infinite loops
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Calculate countdown from expiresAt or default 5 minutes
  useEffect(() => {
    if (!open || !qrString) {
      setCountdown(null);
      setInitialCountdown(null);
      setIsExpired(false);
      return;
    }

    let expiryTime: number;
    if (expiresAt) {
      expiryTime = new Date(expiresAt).getTime();
    } else {
      // Default 5 minutes from now
      expiryTime = Date.now() + 5 * 60 * 1000;
    }

    // Set initial countdown once when dialog opens
    const now = Date.now();
    const initialRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
    setInitialCountdown(initialRemaining);

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

      if (remaining <= 0) {
        setIsExpired(true);
        setCountdown(0);
      } else {
        setCountdown(remaining);
        setIsExpired(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
      setCountdown(null);
      setInitialCountdown(null);
      setIsExpired(false);
    };
  }, [open, qrString, expiresAt]);

  // Auto-refresh status every 5 seconds
  useEffect(() => {
    if (!open || isPaid || isFailed || isExpired) return;

    const interval = setInterval(() => {
      refreshRef.current();
      setAutoRefreshCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [open, isPaid, isFailed, isExpired]);

  // Handle payment status changes
  useEffect(() => {
    if (isPaid) {
      toast({
        title: 'Pembayaran Berhasil',
        description: 'Pembayaran Anda telah berhasil diproses!',
      });
      setTimeout(() => {
        onPaymentSuccess();
        onOpenChange(false);
      }, 2000);
    } else if (isFailed || isExpired) {
      toast({
        variant: 'destructive',
        title: 'Pembayaran Gagal',
        description: isExpired ? 'Pembayaran telah kadaluarsa. Silakan coba lagi.' : 'Pembayaran gagal. Silakan coba lagi.',
      });
      setTimeout(() => {
        onPaymentFailed();
        onOpenChange(false);
      }, 3000);
    }
  }, [isPaid, isFailed, isExpired, onPaymentSuccess, onPaymentFailed, onOpenChange, toast]);

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate countdown progress (0-100%)
  const countdownProgress = countdown !== null && initialCountdown !== null && initialCountdown > 0
    ? ((countdown / initialCountdown) * 100)
    : 0;

  // Copy Order ID to clipboard
  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    toast({
      title: 'Berhasil Disalin',
      description: 'Order ID telah disalin ke clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Prevent closing if payment is pending
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (isPending || (!isPaid && !isFailed && !isExpired))) {
      // Don't allow closing while payment is pending
      return;
    }
    onOpenChange(newOpen);
  };

  // Format Order ID for better readability
  const formatOrderId = (id: string): string => {
    // Format: POS-20260102-6d10d01b-1f36-4c26-9ac0-428893ca288a
    // Display: POS-20260102-6d10d01b
    const parts = id.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    return id;
  };


  // Validate QR string
  if (!qrString || qrString.trim() === '') {
    console.error('[QRIS DIALOG] Invalid QR string:', qrString);
    return null;
  }

  // Log QR string for debugging (first 50 chars only)
  useEffect(() => {
    if (open && qrString) {
      console.log('[QRIS DIALOG] QR String length:', qrString.length);
      console.log('[QRIS DIALOG] QR String preview:', qrString.substring(0, 50) + '...');
    }
  }, [open, qrString]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto [&>button:has(>svg.h-4)]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Custom Close Button */}
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
          disabled={isPending && !isPaid && !isFailed && !isExpired}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <span>Pembayaran QRIS</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Scan QR code dengan aplikasi e-wallet atau mobile banking Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total Pembayaran - Enhanced */}
          <div className="text-center space-y-2 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Total Pembayaran
            </p>
            <p className="text-4xl font-extrabold text-primary">
              {formatCurrency(amount)}
            </p>
          </div>

          {/* QR Code - Enhanced with shadow and better styling */}
          <div className="flex justify-center">
            <div className="relative p-6 bg-white rounded-2xl border-2 border-border shadow-2xl">
              <div className="w-[320px] h-[320px] flex items-center justify-center">
                <QRCode
                  value={qrString}
                  size={320}
                  level="H"
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              {/* Loading indicator - positioned outside QR code area */}
              {isPending && !isPaid && !isFailed && (
                <div className="absolute -top-2 -right-2 bg-primary rounded-full p-2 shadow-lg z-10">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
              {/* Success overlay - only show when paid */}
              {isPaid && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-2xl backdrop-blur-sm animate-in fade-in">
                  <div className="bg-green-500 rounded-full p-4 shadow-xl">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order ID - Enhanced */}
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Order ID</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-base font-mono bg-muted px-4 py-2 rounded-lg border font-semibold">
                {formatOrderId(orderId)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopyOrderId}
                title="Salin Order ID"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Countdown Timer - Enhanced with Progress Bar */}
          {countdown !== null && countdown > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-base font-semibold text-muted-foreground">
                  Kadaluarsa dalam:
                </span>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCountdown(countdown)}
                </span>
              </div>
              <Progress 
                value={countdownProgress} 
                className="h-2"
              />
            </div>
          )}

          {/* Status Badge - Enhanced with animations */}
          <div className="flex justify-center">
            {isPaid ? (
              <Badge className="bg-green-500 text-white px-6 py-3 text-base font-semibold animate-in zoom-in duration-500">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Pembayaran Berhasil
              </Badge>
            ) : isFailed || isExpired ? (
              <Badge variant="destructive" className="px-6 py-3 text-base font-semibold animate-in zoom-in duration-500">
                <XCircle className="h-5 w-5 mr-2" />
                {isExpired ? 'Pembayaran Kadaluarsa' : 'Pembayaran Gagal'}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-6 py-3 text-base font-semibold border-2 animate-pulse">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Menunggu Pembayaran...
              </Badge>
            )}
          </div>

          {/* Payment Instructions */}
          <div className="bg-muted/50 rounded-xl p-5 space-y-3 border">
            <p className="font-semibold text-sm text-foreground">Cara Pembayaran:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
              <li>Pilih fitur <strong>Scan QR</strong> atau <strong>QRIS</strong></li>
              <li>Scan QR code di atas</li>
              <li>Konfirmasi pembayaran di aplikasi Anda</li>
            </ol>
          </div>

          {/* Supported E-wallets */}
          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground font-medium">
              Didukung oleh:
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border text-xs font-medium">
                <span className="text-green-600 font-bold">GoPay</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border text-xs font-medium">
                <span className="text-blue-600 font-bold">OVO</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border text-xs font-medium">
                <span className="text-purple-600 font-bold">Dana</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border text-xs font-medium">
                <span className="text-orange-600 font-bold">LinkAja</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border text-xs font-medium">
                <span className="text-xs">Mobile Banking</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex gap-3 pt-2">
            {isPaid || isFailed || isExpired ? (
              <Button className="flex-1" size="lg" onClick={() => handleOpenChange(false)}>
                Tutup
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="flex-1"
                  size="lg"
                  onClick={() => refreshRef.current()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                  {autoRefreshCount > 0 && (
                    <span className="ml-2 text-xs opacity-70">
                      ({autoRefreshCount})
                    </span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin membatalkan pembayaran ini?')) {
                      onPaymentFailed();
                      handleOpenChange(false);
                    }
                  }}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Batalkan
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
