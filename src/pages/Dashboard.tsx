  
import { useEffect, useState, useCallback } from 'react';
import { productService, reportService, transactionService, Transaction } from '@/lib/api-services';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { TransactionHistory } from '@/components/dashboard/TransactionHistory';
import { LatestTransactions } from '@/components/dashboard/LatestTransactions';
import { ShoppingBag, Clock, CheckCircle2, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
  });
  const [chartData, setChartData] = useState<Array<{ time: string; value: number }>>([]);
  const [transactionHistory, setTransactionHistory] = useState<Array<{
    id: string;
    amount: number;
    timestamp: string;
    status: 'Success' | 'Pending' | 'Failed';
  }>>([]);
  const [latestTransactions, setLatestTransactions] = useState<Transaction[]>([]);
  const [lowStockAlert, setLowStockAlert] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Load daily report for today's stats
      const [dailyReport, productsResponse, transactionsResponse] = await Promise.all([
        reportService.getDaily(today).catch(() => null),
        productService.getAll(),
        transactionService.getAll({ date: today }),
      ]);

      const products = productsResponse.data;
      const transactions = transactionsResponse.data || [];
      
      // Check for low stock
      const lowStockProduct = products.find(p => p.stock !== null && p.stock < 5);
      if (lowStockProduct) {
        setLowStockAlert(`Your product stock "${lowStockProduct.name}" is running low already below 5 Pcs. Please request a new shipment.`);
      }

      // Calculate stats
      const totalOrders = transactions.length;
      const pendingOrders = transactions.filter(t => t.status === 'PENDING').length;
      const completedOrders = transactions.filter(t => t.status === 'SYNCED').length;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts: products.length,
      });

      // Generate chart data from hourly sales
      if (dailyReport?.data?.hourlySales) {
        const hourlyData = Object.entries(dailyReport.data.hourlySales)
          .map(([hour, value]) => ({
            time: `${hour}:00`,
            value: value as number,
          }))
          .sort((a, b) => a.time.localeCompare(b.time));
        setChartData(hourlyData);
      } else if (dailyReport?.data?.hourlySales) {
        const hourlyData = Object.entries(dailyReport.data.hourlySales)
          .map(([hour, value]) => ({
            time: `${hour}:00`,
            value: value as number,
          }))
          .sort((a, b) => a.time.localeCompare(b.time));
        setChartData(hourlyData);
      } else {
        // Fallback: generate sample data
        const hours = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'];
        setChartData(hours.map(hour => ({
          time: hour,
          value: Math.floor(Math.random() * 100) + 20,
        })));
      }

      // Transaction history (last 3 transactions)
      const recentTransactions = transactions
        .slice(0, 3)
        .map(t => ({
          id: t.transactionNumber,
          amount: t.total,
          timestamp: t.createdAt,
          status: t.status === 'SYNCED' ? 'Success' as const : t.status === 'PENDING' ? 'Pending' as const : 'Success' as const,
        }));
      setTransactionHistory(recentTransactions);

      // Latest transactions (for table)
      setLatestTransactions(transactions.slice(0, 10));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {lowStockAlert && (
        <AlertBanner message={lowStockAlert} variant="warning" />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Order"
          value={stats.totalOrders}
          icon={ShoppingBag}
          iconColor="text-primary"
          trend={{
            value: "0.1% than yesterday",
            isPositive: true,
          }}
        />
        <KPICard
          title="Total Pending Order"
          value={stats.pendingOrders}
          icon={Clock}
          iconColor="text-orange-500"
          trend={{
            value: "0.1% than yesterday",
            isPositive: false,
          }}
        />
        <KPICard
          title="Total Completed Order"
          value={stats.completedOrders}
          icon={CheckCircle2}
          iconColor="text-purple-500"
          trend={{
            value: "0.1% than yesterday",
            isPositive: true,
          }}
        />
        <KPICard
          title="Total Product"
          value={stats.totalProducts}
          icon={Package}
          iconColor="text-pink-500"
          description="2 new product"
        />
      </div>

      {/* Chart and Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <TransactionHistory
            items={transactionHistory}
            onViewAll={() => window.location.href = '/reports'}
          />
        </div>
      </div>

      {/* Latest Transactions Table */}
      <LatestTransactions
        transactions={latestTransactions}
        onEdit={(id) => console.log('Edit transaction:', id)}
        onDelete={(id) => console.log('Delete transaction:', id)}
      />
    </div>
  );
}
