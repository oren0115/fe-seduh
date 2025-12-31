import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Trash2, CreditCard } from 'lucide-react';
import { useState } from 'react';
import type { CartItem } from '@/types/transaction.types';
import type { AppliedPromotion } from '@/types/promotion.types';
import type { Shift } from '@/types/shift.types';
import { CartItem as CartItemComponent } from './CartItem';
import { formatCurrency } from '@/utils/currency';

interface CartProps {
  cart: CartItem[];
  subtotal: number;
  total: number;
  appliedPromotions: AppliedPromotion[];
  discountTotal: number;
  activeShift: Shift | null;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function Cart({
  cart,
  subtotal,
  total,
  appliedPromotions,
  discountTotal,
  activeShift,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
}: CartProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleClear = () => {
    onClear();
    setShowClearDialog(false);
  };

  return (
    <div className="lg:col-span-1 flex flex-col border rounded-lg bg-card shadow-sm">
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="font-semibold">Cart</h2>
          {cart.length > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>
        {cart.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowClearDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Clear cart (Esc)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Cart is empty</p>
            <p className="text-sm text-muted-foreground/70">
              Start scanning or selecting products
            </p>
            <div className="mt-6 space-y-1 text-xs text-muted-foreground/60">
              <p className="font-medium">Keyboard Shortcuts:</p>
              <p>• Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">F</kbd> to search</p>
              <p>• Click products to add to cart</p>
              <p>• Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to checkout</p>
            </div>
          </div>
        ) : (
          cart.map(item => (
            <CartItemComponent
              key={item.productId}
              item={item}
              onUpdateQty={onUpdateQty}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Cart?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove all items from the cart? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleClear} variant="destructive">
              Clear Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cart.length > 0 && (
        <div className="border-t p-4 space-y-3 bg-muted/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {appliedPromotions.length > 0 && (
              <div className="space-y-1">
                {appliedPromotions.map((promo) => (
                  <TooltipProvider key={promo.promotionId}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              {promo.name}
                            </Badge>
                          </div>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            -{formatCurrency(promo.discountAmount)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Promotion applied</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
            {discountTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  -{formatCurrency(discountTotal)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="text-primary text-2xl">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button
            className="w-full h-12 text-lg font-semibold"
            onClick={onCheckout}
            size="lg"
            disabled={!activeShift}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {activeShift ? 'Checkout' : 'Check In Required'}
          </Button>
          {!activeShift && (
            <p className="text-xs text-center text-muted-foreground mt-1">
              Please check in to your shift to process transactions
            </p>
          )}
        </div>
      )}
    </div>
  );
}

