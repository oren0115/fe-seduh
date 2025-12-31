import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { CheckOutResult } from '@/types/shift.types';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/classnames';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkOutResult: CheckOutResult | null;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  checkOutResult,
}: CheckoutDialogProps) {
  if (!checkOutResult) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Shift Completed
          </DialogTitle>
          <DialogDescription>
            Your shift has been completed successfully
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shift Time:</span>
              <span className="font-medium">
                {checkOutResult.shift.startTime} - {checkOutResult.shift.endTime}
              </span>
            </div>
            {checkOutResult.shift.checkInTime && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Check-in:</span>
                <span className="font-medium">
                  {format(new Date(checkOutResult.shift.checkInTime), 'HH:mm')}
                </span>
              </div>
            )}
            {checkOutResult.shift.checkOutTime && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Check-out:</span>
                <span className="font-medium">
                  {format(new Date(checkOutResult.shift.checkOutTime), 'HH:mm')}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total Work Time:</span>
              <span className="font-bold">
                {Math.floor(checkOutResult.totalWorkMinutes / 60)}h {checkOutResult.totalWorkMinutes % 60}m
              </span>
            </div>
          </div>

          {checkOutResult.shift.totalTransactions !== undefined && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2">Shift Statistics</h4>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Transactions:</span>
                <span className="font-medium">{checkOutResult.shift.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Sales:</span>
                <span className="font-medium">{formatCurrency(checkOutResult.shift.totalSales || 0)}</span>
              </div>
              {checkOutResult.shift.totalCash !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Cash:</span>
                  <span className="font-medium">{formatCurrency(checkOutResult.shift.totalCash)}</span>
                </div>
              )}
            </div>
          )}

          {checkOutResult.overtimeMinutes > 0 && (
            <div className={cn(
              "p-4 rounded-lg border",
              checkOutResult.overtimeStatus === 'PENDING_APPROVAL'
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className={cn(
                  "h-4 w-4",
                  checkOutResult.overtimeStatus === 'PENDING_APPROVAL' ? "text-yellow-600" : "text-green-600"
                )} />
                <span className="font-semibold text-sm">Overtime</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Overtime Duration:</span>
                <span className="font-medium">
                  {Math.floor(checkOutResult.overtimeMinutes / 60)}h {checkOutResult.overtimeMinutes % 60}m
                </span>
              </div>
              {checkOutResult.overtimeStatus === 'PENDING_APPROVAL' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Overtime requires manager approval
                </p>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

