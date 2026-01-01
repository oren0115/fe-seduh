import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Download, X } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { transactionService } from '@/services/transaction.service';
import type { Transaction } from '@/types/transaction.types';
import type { Shift } from '@/types/shift.types';
import ReceiptViewer from '@/components/ReceiptViewer';

interface TransactionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeShift: Shift | null;
  userId: string | undefined;
}

export function TransactionHistoryDialog({
  open,
  onOpenChange,
  activeShift,
  userId,
}: TransactionHistoryDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  useEffect(() => {
    if (open && activeShift) {
      loadTransactions();
    }
  }, [open, activeShift]);

  const loadTransactions = async () => {
    if (!activeShift) return;
    
    try {
      setLoading(true);
      // Load transactions for the shift date
      const response = await transactionService.getAll({ 
        date: activeShift.date,
      });
      
      // Filter transactions by user
      const filtered = (response.data || []).filter((transaction) => {
        // Filter by user who created the transaction
        if (userId && transaction.createdBy !== userId) {
          return false;
        }
        return true;
      });
      
      // Sort by most recent first
      filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setTransactions(filtered);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      SYNCED: { label: 'Success', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
      LOCAL: { label: 'Local', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.LOCAL;
    return (
      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusInfo.className)}>
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodMap = {
      CASH: { label: 'Cash', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
      CARD: { label: 'Card', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      QRIS: { label: 'QRIS', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      'E-WALLET': { label: 'E-Wallet', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    };
    const methodInfo = methodMap[method as keyof typeof methodMap] || methodMap.CASH;
    return (
      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", methodInfo.className)}>
        {methodInfo.label}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transaction.transactionNumber.toLowerCase().includes(query) ||
      transaction.items.some(item => item.productName.toLowerCase().includes(query))
    );
  });

  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filteredTransactions.length;

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptDialogOpen(true);
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    // TODO: Implement receipt download
    console.log('Download receipt:', transaction._id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Transaction History - Current Shift</DialogTitle>
            <DialogDescription>
              {activeShift && (
                <>
                  Shift: {activeShift.startTime} - {activeShift.endTime} on {format(new Date(activeShift.date), 'MMM dd, yyyy')}
                  {activeShift.checkInTime && (
                    <> • Checked in: {format(new Date(activeShift.checkInTime), 'HH:mm')}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID or product name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading transactions...</div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-muted-foreground mb-2">No transactions found</div>
                  <p className="text-sm text-muted-foreground/70">
                    {searchQuery ? 'Try adjusting your search query' : 'No transactions for this shift yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-foreground">
                              #{transaction.transactionNumber}
                            </span>
                            {getStatusBadge(transaction.status)}
                            {getPaymentMethodBadge(transaction.paymentMethod)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{format(new Date(transaction.createdAt), 'HH:mm:ss')}</span>
                            <span>{transaction.items.length} item(s)</span>
                            <span className="font-semibold text-foreground">
                              {formatCurrency(transaction.total)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReceipt(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
            <DialogDescription>
              Transaction #{selectedTransaction?.transactionNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <ReceiptViewer
              transaction={selectedTransaction}
              onClose={() => setReceiptDialogOpen(false)}
              onPrint={() => window.print()}
              onDownload={() => handleDownloadReceipt(selectedTransaction)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

