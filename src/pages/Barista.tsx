import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShift } from '@/hooks/useShift';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { orderService } from '@/services/order.service';
import type { BaristaOrder, OrderStatus } from '@/types/order.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShiftStatusBar } from '@/components/pos/ShiftStatusBar';
import { Coffee, Clock, CheckCircle2, PlayCircle, Loader2, X, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Barista() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [orders, setOrders] = useState<BaristaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shift management
  const {
    activeShift,
    checkInLoading,
    checkOutLoading,
    checkIn,
    checkOut,
    getShiftTimeRemaining,
    currentTime: shiftCurrentTime,
  } = useShift(user?._id);

  // Real-time clock for elapsed time calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use ref to store latest statusFilter to avoid dependency issues
  const statusFilterRef = useRef(statusFilter);
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const currentFilter = statusFilterRef.current;
      const response = await orderService.getForBarista(
        currentFilter !== 'ALL' ? currentFilter : undefined
      );
      // Backend returns { success: true, data: [...] }
      // Axios wraps response, so response.data is the actual response object
      const responseData = response.data as { success?: boolean; data?: BaristaOrder[] } | BaristaOrder[];
      let ordersArray: BaristaOrder[] = [];
      if (responseData && typeof responseData === 'object') {
        if ('data' in responseData && Array.isArray(responseData.data)) {
          ordersArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          ordersArray = responseData;
        }
      }
      // Sort: QUEUED first, then IN_PROGRESS, then READY
      const statusOrder: Record<OrderStatus, number> = { QUEUED: 0, IN_PROGRESS: 1, READY: 2 };
      const sorted = ordersArray.sort((a, b) => {
        const aOrder = (a.status in statusOrder ? statusOrder[a.status as OrderStatus] : 3);
        const bOrder = (b.status in statusOrder ? statusOrder[b.status as OrderStatus] : 3);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrders(sorted);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Only depend on toast, use ref for statusFilter

  // Store latest loadOrders in ref to avoid dependency issues
  const loadOrdersRef = useRef(loadOrders);
  useEffect(() => {
    loadOrdersRef.current = loadOrders;
  }, [loadOrders]);

  // Initial load and when statusFilter changes
  useEffect(() => {
    // Load immediately
    loadOrdersRef.current();
    
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Create new interval that uses latest loadOrders from ref
    intervalRef.current = setInterval(() => {
      loadOrdersRef.current();
    }, 5000); // Auto-refresh every 5 seconds
    
    // Cleanup on unmount or when statusFilter changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // Only re-run when statusFilter changes, loadOrders accessed via ref

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      await orderService.updateStatus(orderId, { status: newStatus });
      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });
      await loadOrders();
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDismissOrder = async (orderId: string) => {
    try {
      // Remove order from display (client-side only for now)
      setOrders(prev => prev.filter(order => order._id !== orderId));
      toast({
        title: 'Order Dismissed',
        description: 'Order has been removed from display',
      });
    } catch (error) {
      console.error('Failed to dismiss order:', error);
    }
  };

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (date: string) => {
    return differenceInMinutes(currentTime, new Date(date));
  };

  // Get urgency color based on elapsed time
  const getUrgencyColor = (order: BaristaOrder) => {
    const elapsedMinutes = getElapsedMinutes(
      order.status === 'READY' && order.readyAt 
        ? order.readyAt 
        : order.status === 'IN_PROGRESS' && order.startedAt
        ? order.startedAt
        : order.createdAt
    );

    if (order.status === 'READY') {
      if (elapsedMinutes >= 5) return 'border-red-500 bg-red-50/50 dark:bg-red-950/20';
      if (elapsedMinutes >= 3) return 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      return 'border-green-500 bg-green-50/50 dark:bg-green-950/20';
    }
    if (order.status === 'IN_PROGRESS') {
      if (elapsedMinutes >= 10) return 'border-red-500 bg-red-50/50 dark:bg-red-950/20';
      if (elapsedMinutes >= 5) return 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      return 'border-orange-500';
    }
    if (order.status === 'QUEUED') {
      if (elapsedMinutes >= 5) return 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
      return 'border-blue-500';
    }
    return '';
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      QUEUED: { label: 'Queued', className: 'bg-blue-500 text-white', icon: Clock },
      IN_PROGRESS: { label: 'In Progress', className: 'bg-orange-500 text-white', icon: Loader2 },
      READY: { label: 'Ready', className: 'bg-green-500 text-white', icon: CheckCircle2 },
    };
    const statusConfig = config[status];
    const Icon = statusConfig.icon;
    return (
      <Badge className={cn('px-3 py-1', statusConfig.className)}>
        <Icon className="h-3 w-3 mr-1.5" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(order => order.status === status).length;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleShiftsClick = () => {
    navigate('/shifts');
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Shift Status Bar */}
      <ShiftStatusBar
        user={user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        } : null}
        activeShift={activeShift}
        isOnline={isOnline}
        currentTime={shiftCurrentTime}
        shiftTimeRemaining={getShiftTimeRemaining}
        checkInLoading={checkInLoading}
        checkOutLoading={checkOutLoading}
        onCheckIn={checkIn}
        onCheckOut={checkOut}
        onShiftsClick={handleShiftsClick}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Coffee className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Barista Order Display</CardTitle>
                  <CardDescription className="mt-1">
                    {format(currentTime, 'EEEE, d MMMM yyyy • HH:mm:ss')}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{orders.length}</div>
                <div className="text-sm text-muted-foreground">Active Orders</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('ALL')}
            className="h-10"
          >
            All
            <Badge variant="secondary" className="ml-2">
              {orders.length}
            </Badge>
          </Button>
          <Button
            variant={statusFilter === 'QUEUED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('QUEUED')}
            className="h-10"
          >
            Queued
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('QUEUED')}
            </Badge>
          </Button>
          <Button
            variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className="h-10"
          >
            In Progress
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('IN_PROGRESS')}
            </Badge>
          </Button>
          <Button
            variant={statusFilter === 'READY' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('READY')}
            className="h-10"
          >
            Ready
            <Badge variant="secondary" className="ml-2">
              {getStatusCount('READY')}
            </Badge>
          </Button>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-6 rounded-full bg-muted mb-4">
                <Coffee className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Orders</h2>
              <p className="text-muted-foreground">
                {statusFilter === 'ALL' 
                  ? 'Waiting for new orders...' 
                  : `No orders with status: ${statusFilter}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const elapsedMinutes = getElapsedMinutes(
                order.status === 'READY' && order.readyAt 
                  ? order.readyAt 
                  : order.status === 'IN_PROGRESS' && order.startedAt
                  ? order.startedAt
                  : order.createdAt
              );
              const urgencyColor = getUrgencyColor(order);
              const isUrgent = (order.status === 'READY' && elapsedMinutes >= 3) || 
                               (order.status === 'IN_PROGRESS' && elapsedMinutes >= 5) ||
                               (order.status === 'QUEUED' && elapsedMinutes >= 5);

              return (
                <Card
                  key={order._id}
                  className={cn(
                    'border-2 transition-all shadow-md hover:shadow-lg',
                    urgencyColor,
                    order.status === 'READY' && isUrgent && 'animate-pulse'
                  )}
                >
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-semibold font-mono text-foreground mb-1 truncate">
                          {order.orderNumber}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 inline mr-1" />
                            {format(new Date(order.createdAt), 'HH:mm:ss')}
                          </div>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className={cn(
                            'p-3 rounded-lg border',
                            index % 2 === 0 
                              ? 'bg-muted/50 border-border/50' 
                              : 'bg-background border-border/30'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground mb-1">
                                {item.productName}
                              </div>
                              {item.notes && (
                                <div className="text-sm text-muted-foreground italic mt-2 p-2 bg-muted rounded border-l-2 border-primary">
                                  <span className="font-semibold">Note:</span> {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-foreground">×{item.qty}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Items */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg text-center border border-border">
                      <span className="text-sm text-muted-foreground">Total Items: </span>
                      <span className="font-semibold text-lg text-foreground">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)}
                      </span>
                    </div>

                    {/* Elapsed Time / Timing Info */}
                    <div className="mb-4 space-y-1">
                      {order.status === 'QUEUED' && (
                        <div className="text-sm font-medium text-center text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 inline mr-1" />
                          Waiting: {formatDistanceToNow(new Date(order.createdAt), { addSuffix: false })}
                        </div>
                      )}
                      {order.status === 'IN_PROGRESS' && order.startedAt && (
                        <div className="text-sm font-medium text-center text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 inline mr-1" />
                          Started: {format(new Date(order.startedAt), 'HH:mm:ss')} • {formatDistanceToNow(new Date(order.startedAt), { addSuffix: false })} ago
                        </div>
                      )}
                      {order.status === 'READY' && order.readyAt && (
                        <div className="text-sm font-medium text-center text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                          Ready {formatDistanceToNow(new Date(order.readyAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.status === 'QUEUED' && (
                        <Button
                          onClick={() => handleUpdateStatus(order._id, 'IN_PROGRESS')}
                          disabled={updating === order._id}
                          className="flex-1"
                        >
                          {updating === order._id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <PlayCircle className="h-4 w-4 mr-2" />
                          )}
                          Start
                        </Button>
                      )}
                      {order.status === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => handleUpdateStatus(order._id, 'READY')}
                          disabled={updating === order._id}
                          className="flex-1"
                        >
                          {updating === order._id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'READY' && (
                        <>
                          <Badge 
                            variant="outline" 
                            className="flex-1 h-10 items-center justify-center"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Completed
                          </Badge>
                          <Button
                            onClick={() => handleDismissOrder(order._id)}
                            variant="outline"
                            className="h-10 px-4"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
