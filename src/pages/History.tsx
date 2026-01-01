import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MoreVertical, Eye, Download, Calendar } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { transactionService } from '@/services/transaction.service';
import type { Transaction } from '@/types/transaction.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ReceiptViewer from '@/components/ReceiptViewer';

export default function History() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionService.getAll({ date: selectedDate });
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptDialogOpen(true);
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    // TODO: Implement receipt download
    console.log('Download receipt:', transaction._id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all transaction records
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID or product name..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-9 w-full sm:w-auto"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Transactions ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading transactions...</div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-2">No transactions found</div>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery ? 'Try adjusting your search query' : 'No transactions for the selected date'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Transaction ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Items
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Payment Method
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-foreground">
                          #{transaction.transactionNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'HH:mm:ss')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {transaction.items[0]?.productName || 'N/A'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {transaction.items.length > 1
                              ? `${transaction.items.length} items`
                              : `${transaction.items[0]?.qty || 1} pcs`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getPaymentMethodBadge(transaction.paymentMethod)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(transaction.total)}
                        </span>
                        {transaction.paymentMethod === 'CASH' && transaction.change !== undefined && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Change: {formatCurrency(transaction.change)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReceipt(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadReceipt(transaction)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}

