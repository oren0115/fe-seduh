import { useState, useCallback, useMemo } from 'react';
import type { Product } from '@/types/product.types';
import type { CartItem } from '@/types/transaction.types';
import { useToast } from '@/hooks/use-toast';
import { calculateSubtotal } from '@/utils/calculations';

export function useCart(products: Product[] = []) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = useCallback((product: Product) => {
    const isAvailable = product.stock !== null ? product.stock > 0 : product.isAvailable;
    if (!isAvailable) {
      toast({
        variant: 'destructive',
        title: 'Product Unavailable',
        description: 'This product is out of stock',
      });
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        // Check stock when increasing quantity
        const currentProduct = products.find(p => p._id === product._id);
        if (currentProduct && currentProduct.stock !== null) {
          const newQty = existing.qty + 1;
          if (newQty > currentProduct.stock) {
            toast({
              variant: 'destructive',
              title: 'Insufficient Stock',
              description: `Only ${currentProduct.stock} units available in stock`,
            });
            return prev;
          }
        }
        return prev.map(item =>
          item.productId === product._id
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product._id,
        productName: product.name,
        category: product.category,
        price: product.price,
        qty: 1,
        subtotal: product.price,
      }];
    });
  }, [toast, products]);

  const updateCartItemQty = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.productId === productId);
      if (!item) return prev;
      
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return prev.filter(i => i.productId !== productId);
      }
      
      // Check stock when increasing quantity (delta > 0)
      if (delta > 0) {
        const product = products.find(p => p._id === productId);
        if (product && product.stock !== null) {
          if (newQty > product.stock) {
            toast({
              variant: 'destructive',
              title: 'Insufficient Stock',
              description: `Only ${product.stock} units available in stock`,
            });
            return prev;
          }
        }
      }
      
      return prev.map(i =>
        i.productId === productId
          ? { ...i, qty: newQty, subtotal: newQty * i.price }
          : i
      );
    });
  }, [toast, products]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const subtotal = useMemo(() => calculateSubtotal(cart), [cart]);

  return {
    cart,
    subtotal,
    addToCart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
  };
}

