export interface DailyReport {
  date: string;
  summary: {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
  };
  paymentMethods: Record<string, number>;
  hourlySales: Record<string, number>;
}

export interface MonthlyReport {
  period: {
    year: number;
    month: number;
  };
  summary: {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
  };
  dailySales: Record<string, number>;
  categorySales: Record<string, number>;
  bestSellers: Array<{
    rank: number;
    name: string;
    qty: number;
    revenue: number;
  }>;
}

export interface BestSeller {
  rank: number;
  name: string;
  qty: number;
  revenue: number;
}

