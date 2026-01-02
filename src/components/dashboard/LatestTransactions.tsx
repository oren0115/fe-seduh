import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransactionItem {
  _id: string;
  transactionNumber: string;
  items: Array<{
    productName: string;
    qty: number;
  }>;
  total: number;
  status: 'LOCAL' | 'SYNCED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELED';
  createdAt: string;
}

interface LatestTransactionsProps {
  transactions: TransactionItem[];
  onViewAll?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function LatestTransactions({ transactions, onViewAll, onEdit, onDelete }: LatestTransactionsProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      SYNCED: { label: 'Success', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      PAID: { label: 'Paid', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
      PENDING: { label: 'Pending', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
      LOCAL: { label: 'Local', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
      EXPIRED: { label: 'Expired', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
      CANCELED: { label: 'Canceled', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.LOCAL;
    return (
      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusInfo.className)}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Latest Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64 h-9"
              />
            </div>
            {onViewAll && (
              <Button variant="outline" size="sm" className="h-9" onClick={onViewAll}>
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Transaction ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction._id}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-foreground">
                      #{transaction.transactionNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {transaction.items[0]?.productName || 'N/A'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.items.length > 1
                          ? `${transaction.items[0]?.productName} + ${transaction.items.length - 1} more`
                          : `${transaction.items[0]?.productName} ${transaction.items[0]?.qty || 1}Pcs`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(transaction.total)}
                    </span>
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
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(transaction._id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(transaction._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

