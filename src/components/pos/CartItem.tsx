import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, X } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types/transaction.types';
import { formatCurrency } from '@/utils/currency';

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.productName}</h4>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(item.price)} × {item.qty}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive shrink-0"
            onClick={() => onRemove(item.productId)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQty(item.productId, -1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{item.qty}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onUpdateQty(item.productId, 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(item.subtotal)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

