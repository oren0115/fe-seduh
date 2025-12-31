export interface Promotion {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  conditions: {
    minTransactionAmount?: number;
    productIds?: string[];
    categoryIds?: string[];
    dayOfWeek?: number[];
    specificDates?: string[];
    timeRange?: {
      start: string;
      end: string;
    };
  };
  discount: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    maxDiscount?: number;
  };
  priority: number;
  stackable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionData {
  name: string;
  description?: string;
  isActive?: boolean;
  validFrom: string;
  validUntil: string;
  conditions?: Promotion['conditions'];
  discount: Promotion['discount'];
  priority?: number;
  stackable?: boolean;
}

export interface ApplyPromotionData {
  items: Array<{
    productId: string;
    productName: string;
    category: string;
    qty: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  transactionDate?: string;
}

export interface PromotionResult {
  discountTotal: number;
  appliedPromotions: Array<{
    promotionId: string;
    name: string;
    discountAmount: number;
  }>;
}

export interface AppliedPromotion {
  promotionId: string;
  name: string;
  discountAmount: number;
}

