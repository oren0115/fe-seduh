import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Eye, 
  Clock, 
  User, 
  Calendar, 
  Receipt, 
  Coffee, 
  DollarSign,
  Filter,
  X
} from 'lucide-react';
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
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && activeShift) {
      loadTransactions();
      // Auto-focus search input when dialog opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
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

  // Helper function to get shift name based on time
  const getShiftName = (startTime: string): string => {
    const [startHour] = startTime.split(':').map(Number);
    if (startHour >= 6 && startHour < 12) return 'Morning';
    if (startHour >= 12 && startHour < 18) return 'Afternoon';
    if (startHour >= 18 || startHour < 6) return 'Evening';
    return 'Shift';
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
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        transaction.transactionNumber.toLowerCase().includes(query) ||
        transaction.items.some(item => item.productName.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Payment method filter
    if (paymentFilter !== 'ALL') {
      if (transaction.paymentMethod !== paymentFilter) return false;
    }
    
    return true;
  });

  // Calculate statistics
  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = filteredTransactions.length;
  const totalItemsSold = filteredTransactions.reduce((sum, t) => 
    sum + t.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0
  );
  
  // Payment breakdown
  const cashTotal = filteredTransactions
    .filter(t => t.paymentMethod === 'CASH')
    .reduce((sum, t) => sum + t.total, 0);
  const nonCashTotal = filteredTransactions
    .filter(t => t.paymentMethod !== 'CASH')
    .reduce((sum, t) => sum + t.total, 0);
  
  const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'CASH').length;
  const qrisTransactions = filteredTransactions.filter(t => t.paymentMethod === 'QRIS').length;

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setReceiptDialogOpen(true);
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    // TODO: Implement receipt download
    console.log('Download receipt:', transaction._id);
  };

  const kasirName = activeShift?.user?.name || 'Kasir';
  const shiftName = activeShift ? getShiftName(activeShift.startTime) : '';
  const shiftDate = activeShift ? format(new Date(activeShift.date), 'd MMM yyyy') : '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Transaction History – Current Shift</DialogTitle>
            {activeShift && (
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Shift:</span>
                  <span>{shiftName} ({activeShift.startTime}–{activeShift.endTime})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Kasir:</span>
                  <span>{kasirName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Tanggal:</span>
                  <span>{shiftDate}</span>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Transactions</p>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {loading ? <Skeleton className="h-8 w-20" /> : totalTransactions}
                </p>
                <div className="flex items-center gap-3 text-xs text-blue-700/70 dark:text-blue-400/70">
                  <span>Cash: {cashTransactions}</span>
                  <span>QRIS: {qrisTransactions}</span>
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/30">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">Total Sales</p>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                  {loading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalSales)}
                </p>
                <div className="flex items-center gap-3 text-xs text-green-700/70 dark:text-green-400/70">
                  <span>Cash: {formatCurrency(cashTotal)}</span>
                  <span>QRIS: {formatCurrency(nonCashTotal)}</span>
                </div>
              </div>
            </div>
            
            {/* Items Sold Card */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Items Sold</p>
                <span className="text-lg font-bold text-amber-700 dark:text-amber-400 ml-auto">
                  {loading ? <Skeleton className="h-6 w-16 inline-block" /> : totalItemsSold}
                </span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by transaction ID, product, or payment..."
                  className="pl-9 pr-9 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[140px] focus:ring-0 focus:ring-offset-0">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="E-WALLET">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto border rounded-lg bg-background">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in-50 duration-300">
                  <div className="mb-4 p-4 rounded-full bg-muted/50">
                    <Coffee className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery || paymentFilter !== 'ALL' ? 'No transactions found' : 'No transactions yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {searchQuery || paymentFilter !== 'ALL' 
                      ? 'Try adjusting your search query or filter to see more results.'
                      : activeShift 
                        ? "This shift hasn't processed any orders yet. Start by checking in and serving your first customer."
                        : "No active shift. Check in to start processing transactions."}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setPaymentFilter('ALL');
                      }}
                      className="mt-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {/* Table Header - Desktop only */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 p-3 bg-muted/30 text-xs font-semibold text-muted-foreground border-b sticky top-0 z-10">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">Transaction ID</div>
                    <div className="col-span-2">Items</div>
                    <div className="col-span-2">Payment</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>
                  
                  {filteredTransactions.map((transaction, index) => (
                    <div
                      key={transaction._id}
                      className="p-4 hover:bg-accent/50 transition-all duration-200 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleViewReceipt(transaction)}
                    >
                      <div className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 md:gap-4">
                        {/* Time */}
                        <div className="col-span-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground hidden md:block" />
                          <span className="text-sm font-medium text-foreground">
                            {format(new Date(transaction.createdAt), 'HH:mm:ss')}
                          </span>
                        </div>
                        
                        {/* Transaction ID & Badges */}
                        <div className="col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            #{transaction.transactionNumber}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(transaction.status)}
                            {getPaymentMethodBadge(transaction.paymentMethod)}
                          </div>
                        </div>
                        
                        {/* Items */}
                        <div className="col-span-2 flex items-center gap-2">
                          <Coffee className="h-4 w-4 text-muted-foreground hidden md:block" />
                          <span className="text-sm text-muted-foreground">
                            {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Payment Method */}
                        <div className="col-span-2">
                          {getPaymentMethodBadge(transaction.paymentMethod)}
                        </div>
                        
                        {/* Total - Right aligned */}
                        <div className="col-span-2 text-left md:text-right">
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(transaction.total)}
                          </span>
                        </div>
                        
                        {/* Action */}
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReceipt(transaction);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="hidden lg:inline">View</span>
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

