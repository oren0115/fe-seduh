import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '@/services/order.service';
import type { Order, Station, OrderStatus } from '@/types/order.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Utensils, Clock, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function KDS() {
  const [searchParams] = useSearchParams();
  const station = (searchParams.get('station') || 'BAR') as Station;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getByStation(station);
      // Sort: QUEUED first, then IN_PROGRESS, then READY
      const sorted = (response.data || []).sort((a, b) => {
        const statusOrder = { QUEUED: 0, IN_PROGRESS: 1, READY: 2 };
        const aOrder = statusOrder[a.status] ?? 3;
        const bOrder = statusOrder[b.status] ?? 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrders(sorted);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [station]);

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 3 seconds
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      await orderService.updateStatusKDS(orderId, { status: newStatus });
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      QUEUED: { label: 'QUEUED', className: 'bg-blue-500 text-white', icon: Clock },
      IN_PROGRESS: { label: 'IN PROGRESS', className: 'bg-orange-500 text-white', icon: Loader2 },
      READY: { label: 'READY', className: 'bg-green-500 text-white', icon: CheckCircle2 },
    };
    const statusConfig = config[status];
    const Icon = statusConfig.icon;
    return (
      <Badge className={cn('text-lg px-4 py-2 font-bold', statusConfig.className)}>
        <Icon className="h-5 w-5 mr-2" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getStationIcon = () => {
    return station === 'BAR' ? (
      <Coffee className="h-8 w-8" />
    ) : (
      <Utensils className="h-8 w-8" />
    );
  };

  const getStationColor = () => {
    return station === 'BAR' ? 'bg-blue-600' : 'bg-orange-600';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className={cn('mb-6 p-6 rounded-lg text-white shadow-lg', getStationColor())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStationIcon()}
            <div>
              <h1 className="text-3xl font-bold">{station} ORDER DISPLAY</h1>
              <p className="text-sm opacity-90 mt-1">
                {format(new Date(), 'EEEE, d MMMM yyyy • HH:mm:ss')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-sm opacity-90">Active Orders</div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 rounded-full bg-muted mb-4">
            {getStationIcon()}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Orders</h2>
          <p className="text-muted-foreground">Waiting for new orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 transition-all',
                order.status === 'QUEUED' && 'border-blue-500',
                order.status === 'IN_PROGRESS' && 'border-orange-500',
                order.status === 'READY' && 'border-green-500'
              )}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-mono text-muted-foreground">
                    {order.orderNumber}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(order.createdAt), 'HH:mm:ss')}
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.type} • {item.station}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">x{item.qty}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Items */}
              <div className="mb-4 p-2 bg-muted rounded text-center">
                <span className="text-sm text-muted-foreground">Total Items: </span>
                <span className="font-bold text-lg">
                  {order.items.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'QUEUED' && (
                  <Button
                    onClick={() => handleUpdateStatus(order._id, 'IN_PROGRESS')}
                    disabled={updating === order._id}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    size="lg"
                  >
                    {updating === order._id ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <PlayCircle className="h-5 w-5 mr-2" />
                    )}
                    Start
                  </Button>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => handleUpdateStatus(order._id, 'READY')}
                    disabled={updating === order._id}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    size="lg"
                  >
                    {updating === order._id ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                    )}
                    Ready
                  </Button>
                )}
                {order.status === 'READY' && (
                  <div className="flex-1 text-center py-2 text-green-600 font-semibold">
                    ✓ Completed
                  </div>
                )}
              </div>

              {/* Time Info */}
              {order.startedAt && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Started: {format(new Date(order.startedAt), 'HH:mm:ss')}
                </div>
              )}
              {order.readyAt && (
                <div className="mt-1 text-xs text-muted-foreground text-center">
                  Ready: {format(new Date(order.readyAt), 'HH:mm:ss')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

