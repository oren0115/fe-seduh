import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBannerProps {
  message: string;
  variant?: 'info' | 'warning' | 'error';
}

export function AlertBanner({ message, variant = 'info' }: AlertBannerProps) {
  return (
    <div className={cn(
      "w-full rounded-lg p-4 mb-6 flex items-start gap-3",
      variant === 'info' && "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50",
      variant === 'warning' && "bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border border-orange-200/50 dark:border-orange-800/50",
      variant === 'error' && "bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 border border-red-200/50 dark:border-red-800/50",
    )}>
      <AlertCircle className={cn(
        "h-5 w-5 mt-0.5 flex-shrink-0",
        variant === 'info' && "text-blue-600 dark:text-blue-400",
        variant === 'warning' && "text-orange-600 dark:text-orange-400",
        variant === 'error' && "text-red-600 dark:text-red-400",
      )} />
      <p className={cn(
        "text-sm font-medium flex-1",
        variant === 'info' && "text-blue-900 dark:text-blue-100",
        variant === 'warning' && "text-orange-900 dark:text-orange-100",
        variant === 'error' && "text-red-900 dark:text-red-100",
      )}>
        {message}
      </p>
    </div>
  );
}

