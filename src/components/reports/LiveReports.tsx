
import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  ShoppingBag, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  DollarSign 
} from 'lucide-react';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const REFRESH_INTERVAL = 30000; // 30 seconds

const LiveReports = () => {
  const { orders, refreshOrders, loading } = useData();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshOrders();
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshOrders]);
  
  const handleRefresh = () => {
    refreshOrders();
    setLastRefresh(new Date());
  };
  
  // Real-time statistics
  const liveStats = useMemo(() => {
    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= today;
    });
    
    const pendingOrders = todaysOrders.filter(order => order.status === 'pending');
    const inProgressOrders = todaysOrders.filter(order => order.status === 'in-progress');
    const completedOrders = todaysOrders.filter(order => order.status === 'completed');
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    return {
      totalOrders: todaysOrders.length,
      pendingCount: pendingOrders.length,
      inProgressCount: inProgressOrders.length,
      completedCount: completedOrders.length,
      totalRevenue,
      averageOrderValue
    };
  }, [orders]);
  
  // Status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= today;
    });
    
    const counts: Record<OrderStatus, number> = {
      'pending': 0,
      'in-progress': 0,
      'completed': 0,
      'cancelled': 0
    };
    
    todaysOrders.forEach(order => {
      counts[order.status]++;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0) // Only show statuses with orders
      .map(([status, count]) => ({
        name: status,
        value: count
      }));
  }, [orders]);
  
  // Item popularity for today
  const popularItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= today;
    });
    
    const itemCounts: Record<string, { count: number, revenue: number }> = {};
    
    todaysOrders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          const itemName = item.name;
          if (!itemCounts[itemName]) {
            itemCounts[itemName] = { count: 0, revenue: 0 };
          }
          itemCounts[itemName].count += item.quantity;
          itemCounts[itemName].revenue += item.subtotal;
        });
      }
    });
    
    return Object.entries(itemCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [orders]);
  
  const formatLastRefreshTime = () => {
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Live Monitoring</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatLastRefreshTime()}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50" : ""}
            >
              Auto Refresh: {autoRefresh ? "ON" : "OFF"}
            </Button>
            <Button 
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Now
            </Button>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${liveStats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg. ${liveStats.averageOrderValue.toFixed(2)} per order
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {liveStats.completedCount} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats.pendingCount + liveStats.inProgressCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {liveStats.pendingCount} pending, {liveStats.inProgressCount} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No orders today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Items Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {popularItems.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularItems}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Quantity Sold" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No items sold today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Items</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(order => order.status === 'pending' || order.status === 'in-progress').length > 0 ? (
                    orders
                      .filter(order => order.status === 'pending' || order.status === 'in-progress')
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-2">{order.id.substring(0, 8)}</td>
                          <td className="p-2">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-2">{order.customer?.name || 'Walk-in Customer'}</td>
                          <td className="p-2">
                            <ul className="list-disc list-inside">
                              {order.items.map((item, idx) => (
                                <li key={idx} className="text-sm">
                                  {item.quantity}x {item.name}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="text-right p-2">${order.totalAmount.toFixed(2)}</td>
                          <td className="p-2">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", {
                              "bg-yellow-100 text-yellow-800": order.status === 'pending',
                              "bg-blue-100 text-blue-800": order.status === 'in-progress',
                            })}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-muted-foreground">
                        No active orders at this time
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveReports;
