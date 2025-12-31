import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TransactionHistoryItem {
  id: string;
  amount: number;
  timestamp: string;
  status: 'Success' | 'Pending' | 'Failed';
}

interface TransactionHistoryProps {
  items: TransactionHistoryItem[];
  onViewAll?: () => void;
}

export function TransactionHistory({ items, onViewAll }: TransactionHistoryProps) {
  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              item.status === 'Success' && "bg-green-100 dark:bg-green-900/30",
              item.status === 'Pending' && "bg-orange-100 dark:bg-orange-900/30",
              item.status === 'Failed' && "bg-red-100 dark:bg-red-900/30",
            )}>
              <CheckCircle2 className={cn(
                "h-4 w-4",
                item.status === 'Success' && "text-green-600 dark:text-green-400",
                item.status === 'Pending' && "text-orange-600 dark:text-orange-400",
                item.status === 'Failed' && "text-red-600 dark:text-red-400",
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Payment from #{item.id}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.timestamp), "EEEE, hh:mm a")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{formatCurrency(item.amount)}
              </p>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                item.status === 'Success' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                item.status === 'Pending' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                item.status === 'Failed' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
              )}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
        {onViewAll && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={onViewAll}
          >
            View All Transaction
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

