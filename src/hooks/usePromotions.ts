import { useState, useEffect } from 'react';
import { promotionService } from '@/services/promotion.service';
import type { CartItem } from '@/types/transaction.types';
import type { AppliedPromotion } from '@/types/promotion.types';

export function usePromotions(cart: CartItem[]) {
  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([]);
  const [discountTotal, setDiscountTotal] = useState(0);

  useEffect(() => {
    const applyPromotions = async () => {
      if (cart.length === 0) {
        setAppliedPromotions([]);
        setDiscountTotal(0);
        return;
      }

      try {
        const promotionData = {
          items: cart.map(item => ({
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
          })),
          subtotal: cart.reduce((sum, item) => sum + item.subtotal, 0),
          transactionDate: new Date().toISOString(),
        };

        const response = await promotionService.apply(promotionData);
        setAppliedPromotions(response.data.appliedPromotions);
        setDiscountTotal(response.data.discountTotal);
      } catch (error) {
        console.error('Failed to apply promotions:', error);
        setAppliedPromotions([]);
        setDiscountTotal(0);
      }
    };

    applyPromotions();
  }, [cart]);

  const clearPromotions = () => {
    setAppliedPromotions([]);
    setDiscountTotal(0);
  };

  return {
    appliedPromotions,
    discountTotal,
    clearPromotions,
  };
}

