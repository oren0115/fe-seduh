import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, AlertTriangle, Star, Package, CheckCircle2 } from 'lucide-react';
import type { Product } from '@/types/product.types';
import type { CartItem } from '@/types/transaction.types';
import { formatCurrency } from '@/utils/currency';
import { getImageUrl } from '@/lib/image-utils';
import { cn } from '@/utils/classnames';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Coffee': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Non-Coffee': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Food': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Snack': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
};

export function ProductCard({ product, cart, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const isAvailable = product.stock !== null ? product.stock > 0 : product.isAvailable;
  const isLowStock = product.stock !== null && product.stock > 0 && product.stock <= 5;
  const isBestSeller = false; // Can be determined from product data
  
  // Check if product is in cart
  const cartItem = cart.find(item => item.productId === product._id);
  const cartQuantity = cartItem?.qty || 0;
  const isInCart = cartQuantity > 0;

  const handleAddToCart = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!isAvailable || isAdding) return;

    setIsAdding(true);
    onAddToCart(product);
    
    // Show success animation
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsAdding(false);
    }, 600);
  };

  // Reset success state when cart quantity changes
  useEffect(() => {
    if (cartQuantity > 0 && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 600);
      return () => clearTimeout(timer);
    }
  }, [cartQuantity, showSuccess]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
      e.preventDefault();
      handleAddToCart(e);
    }
  };

  // Stock percentage for visual indicator
  const stockPercentage = product.stock !== null && product.stock > 0
    ? Math.min((product.stock / 100) * 100, 100) // Assuming 100 is max stock
    : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "relative cursor-pointer transition-all duration-200 group",
              "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
              "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
              "active:scale-[0.98]",
              !isAvailable && "opacity-60 cursor-not-allowed",
              showSuccess && "ring-2 ring-green-500 ring-offset-2"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleAddToCart}
            role="button"
            tabIndex={isAvailable ? 0 : -1}
            aria-label={`${product.name} - ${formatCurrency(product.price)}${isInCart ? ` (${cartQuantity} in cart)` : ''}`}
            aria-disabled={!isAvailable}
            onKeyDown={handleKeyDown}
          >
            <CardContent className="p-2.5 md:p-3">
              {/* Image Container */}
              <div className="relative w-full aspect-square rounded-lg mb-2 overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <img
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <span className="text-4xl opacity-50">☕</span>
                  </div>
                )}
                
                {/* Top Right Corner - Add Button & Quantity Badge */}
                <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1.5">
                  {/* Quantity Badge (always visible if in cart) */}
                  {isInCart && (
                    <Badge 
                      className={cn(
                        "h-7 w-7 rounded-full p-0 flex items-center justify-center font-bold text-xs",
                        "bg-primary text-primary-foreground shadow-lg",
                        "animate-in fade-in zoom-in duration-200"
                      )}
                      aria-label={`${cartQuantity} in cart`}
                    >
                      {cartQuantity}
                    </Badge>
                  )}
                  
                  {/* Add Button (corner, touch-friendly) - Always visible on tablet/mobile via CSS */}
                  {isAvailable && (
                    <Button
                      size="icon"
                      className={cn(
                        "h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg",
                        "transition-all duration-200 touch-manipulation",
                        "md:opacity-0 md:group-hover:opacity-100 opacity-100",
                        "animate-in fade-in zoom-in duration-200",
                        showSuccess && "bg-green-500 hover:bg-green-600"
                      )}
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {showSuccess ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Top Left - Badges (Best Seller, Low Stock) */}
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                  {isBestSeller && (
                    <Badge className="bg-yellow-500 text-white border-0 text-[9px] px-1.5 py-0.5 shadow-md">
                      <Star className="h-2 w-2 mr-0.5" />
                      Best
                    </Badge>
                  )}
                  {isLowStock && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 shadow-md">
                      <AlertTriangle className="h-2 w-2 mr-0.5" />
                      Low
                    </Badge>
                  )}
                </div>

                {/* Success Overlay Animation */}
                {showSuccess && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white/90 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-300">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info - Compact Layout */}
              <div className="space-y-1.5">
                {/* Product Name and Category Row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 
                    className={cn(
                      "font-semibold text-sm leading-tight line-clamp-2 flex-1 min-w-0",
                      "group-hover:text-primary transition-colors"
                    )}
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 h-4 shrink-0",
                      getCategoryColor(product.category)
                    )}
                  >
                    {product.category}
                  </Badge>
                </div>

                {/* Price and Stock Row */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base md:text-lg font-bold text-primary leading-none">
                    {formatCurrency(product.price)}
                  </p>
                  
                  {/* Stock Info - Compact */}
                  {product.stock !== null && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Package className={cn(
                        "h-3 w-3",
                        isLowStock ? "text-orange-600 dark:text-orange-400" : ""
                      )} />
                      <span className={cn(
                        isLowStock ? "text-orange-600 dark:text-orange-400 font-medium" : ""
                      )}>
                        {product.stock}
                      </span>
                      {product.stock <= 20 && (
                        <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-300",
                              isLowStock 
                                ? "bg-orange-500" 
                                : "bg-primary"
                            )}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {product.stock === null && !isAvailable && (
                    <p className="text-[10px] text-destructive font-medium flex items-center gap-1 shrink-0">
                      <AlertTriangle className="h-3 w-3" />
                      Out
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs"
          sideOffset={5}
        >
          <div className="space-y-1.5">
            <p className="font-semibold text-sm">{product.name}</p>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between pt-1 border-t">
              <p className="text-sm font-medium text-primary">
                {formatCurrency(product.price)}
              </p>
              {isInCart && (
                <Badge variant="secondary" className="text-xs">
                  {cartQuantity} in cart
                </Badge>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
