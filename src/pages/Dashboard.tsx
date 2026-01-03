  
import { useEffect, useState, useCallback, useRef } from 'react';
import { productService, reportService, transactionService, leaveRequestService, Transaction, LeaveRequest } from '@/lib/api-services';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { TransactionHistory } from '@/components/dashboard/TransactionHistory';
import { LatestTransactions } from '@/components/dashboard/LatestTransactions';
import { useNotifications } from '@/components/NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Clock, CheckCircle2, Package } from 'lucide-react';
import { format, subDays } from 'date-fns';

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
  const [trends, setTrends] = useState({
    totalOrders: { value: '0% than yesterday', isPositive: true },
    pendingOrders: { value: '0% than yesterday', isPositive: true },
    completedOrders: { value: '0% than yesterday', isPositive: true },
  });
  const [newProductsCount, setNewProductsCount] = useState(0);
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const notifiedLowStockRef = useRef<Set<string>>(new Set());
  const notifiedLeaveRequestsRef = useRef<Set<string>>(new Set());

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      // Load daily report for today's stats and yesterday's data
      // Only load leave requests if user is owner/admin
      const isAdmin = user?.role === 'OWNER';
      const [dailyReport, productsResponse, transactionsResponse, yesterdayTransactionsResponse, pendingLeavesResponse] = await Promise.all([
        reportService.getDaily(today).catch(() => null),
        productService.getAll(),
        transactionService.getAll({ date: today }),
        transactionService.getAll({ date: yesterday }).catch(() => ({ data: [] })),
        isAdmin ? leaveRequestService.getAll({ status: 'PENDING' }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      const products = productsResponse.data;
      const transactions = transactionsResponse.data || [];
      const yesterdayTransactions = yesterdayTransactionsResponse.data || [];
      const pendingLeaves = pendingLeavesResponse.data || [];
      
      // Check for low stock and add notifications
      const lowStockProducts = products.filter(p => p.stock !== null && p.stock < 5);
      if (lowStockProducts.length > 0) {
        const firstLowStock = lowStockProducts[0];
        const alertMessage = lowStockProducts.length === 1
          ? `Your product stock "${firstLowStock.name}" is running low already below 5 Pcs. Please request a new shipment.`
          : `${lowStockProducts.length} products are running low (below 5 Pcs). Please check and request new shipments.`;
        setLowStockAlert(alertMessage);
        
        // Add notification for each low stock product (only once per product)
        lowStockProducts.forEach(product => {
          if (!notifiedLowStockRef.current.has(product._id)) {
            addNotification({
              type: 'warning',
              title: 'Low Stock Alert',
              message: `Product "${product.name}" is running low (${product.stock} Pcs remaining). Please request a new shipment.`,
            });
            notifiedLowStockRef.current.add(product._id);
          }
        });
      } else {
        setLowStockAlert(null);
      }

      // Calculate stats
      const totalOrders = transactions.length;
      const pendingOrders = transactions.filter(t => t.status === 'PENDING').length;
      const completedOrders = transactions.filter(t => t.status === 'SYNCED').length;

      // Calculate yesterday's stats
      const yesterdayTotalOrders = yesterdayTransactions.length;
      const yesterdayPendingOrders = yesterdayTransactions.filter(t => t.status === 'PENDING').length;
      const yesterdayCompletedOrders = yesterdayTransactions.filter(t => t.status === 'SYNCED').length;

      // Calculate percentage changes
      const calculatePercentageChange = (today: number, yesterday: number): { value: string; isPositive: boolean } => {
        if (yesterday === 0) {
          if (today === 0) {
            return { value: 'No change', isPositive: true };
          }
          return { value: 'New', isPositive: true };
        }
        const change = ((today - yesterday) / yesterday) * 100;
        const absChange = Math.abs(change);
        if (absChange < 0.01) {
          return { value: 'No change', isPositive: true };
        }
        const formattedChange = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        return {
          value: `${formattedChange} than yesterday`,
          isPositive: change >= 0,
        };
      };

      setTrends({
        totalOrders: calculatePercentageChange(totalOrders, yesterdayTotalOrders),
        pendingOrders: calculatePercentageChange(pendingOrders, yesterdayPendingOrders),
        completedOrders: calculatePercentageChange(completedOrders, yesterdayCompletedOrders),
      });

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts: products.length,
      });

      // Calculate new products (products created in the last 7 days)
      const sevenDaysAgo = subDays(new Date(), 7);
      const newProducts = products.filter(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= sevenDaysAgo;
      });
      setNewProductsCount(newProducts.length);

      // Add notifications for pending leave requests (admin only)
      if (isAdmin && pendingLeaves.length > 0) {
        pendingLeaves.forEach((leave: LeaveRequest) => {
          if (!notifiedLeaveRequestsRef.current.has(leave._id)) {
            const userName = leave.user?.name || 'Unknown';
            const leaveType = leave.type === 'SICK' ? 'Sakit' : leave.type === 'PERMISSION' ? 'Izin' : 'Cuti Tahunan';
            addNotification({
              type: 'info',
              title: 'Pengajuan Cuti Baru',
              message: `${userName} mengajukan ${leaveType} dari ${format(new Date(leave.startDate), 'dd MMM yyyy')} hingga ${format(new Date(leave.endDate), 'dd MMM yyyy')}.`,
            });
            notifiedLeaveRequestsRef.current.add(leave._id);
          }
        });
      }

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
      addNotification({
        type: 'error',
        title: 'Failed to Load Dashboard',
        message: 'Unable to load dashboard data. Please refresh the page.',
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

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
          trend={trends.totalOrders}
        />
        <KPICard
          title="Total Pending Order"
          value={stats.pendingOrders}
          icon={Clock}
          iconColor="text-orange-500"
          trend={trends.pendingOrders}
        />
        <KPICard
          title="Total Completed Order"
          value={stats.completedOrders}
          icon={CheckCircle2}
          iconColor="text-purple-500"
          trend={trends.completedOrders}
        />
        <KPICard
          title="Total Product"
          value={stats.totalProducts}
          icon={Package}
          iconColor="text-pink-500"
          description={newProductsCount > 0 ? `${newProductsCount} new product${newProductsCount > 1 ? 's' : ''}` : undefined}
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
