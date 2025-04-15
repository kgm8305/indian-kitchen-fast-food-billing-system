
import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { fetchOrdersByDateRange } from '@/utils/databaseOperations';
import { OrderStatus } from '@/types';
import { CalendarIcon, RefreshCw, DollarSign, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DailyReports = () => {
  const { orders: allOrders, refreshOrders } = useData();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
  const displayDate = date ? format(date, 'MMMM d, yyyy') : 'Today';
  
  // Fetch orders for the selected date
  const startDateStr = date ? format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss") : '';
  const endDateStr = date ? format(endOfDay(date), "yyyy-MM-dd'T'HH:mm:ss") : '';
  
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', formattedDate],
    queryFn: () => fetchOrdersByDateRange(startDateStr, endDateStr),
    enabled: !!date,
  });

  // Calculate daily statistics
  const stats = useMemo(() => {
    const completedOrders = orders.filter(order => order.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const completedOrderCount = completedOrders.length;
    const averageOrderValue = completedOrderCount > 0 ? totalRevenue / completedOrderCount : 0;
    
    return {
      totalRevenue,
      totalOrders,
      completedOrderCount,
      averageOrderValue
    };
  }, [orders]);

  // Calculate item popularity
  const itemPopularity = useMemo(() => {
    const itemCounts: Record<string, { count: number, revenue: number }> = {};
    
    orders.forEach(order => {
      if (order.status === 'completed' || order.status === 'in-progress') {
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
      .slice(0, 5);
  }, [orders]);

  // Calculate status breakdown
  const statusBreakdown = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      'pending': 0,
      'in-progress': 0,
      'completed': 0,
      'cancelled': 0
    };
    
    orders.forEach(order => {
      counts[order.status]++;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [orders]);

  // Calculate hourly revenue
  const hourlyRevenue = useMemo(() => {
    const hourly: Record<number, number> = {};
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      hourly[i] = 0;
    }
    
    orders
      .filter(order => order.status === 'completed')
      .forEach(order => {
        const hour = new Date(order.timestamp).getHours();
        hourly[hour] += order.totalAmount;
      });
    
    return Object.entries(hourly).map(([hour, amount]) => ({
      hour: `${hour}:00`,
      revenue: amount
    }));
  }, [orders]);

  // Handle date change
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Daily Performance</h2>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {displayDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              For {displayDate}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedOrderCount} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.averageOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per completed order
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrders === 0
                ? '0%'
                : `${((stats.completedOrderCount / stats.totalOrders) * 100).toFixed(0)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hourly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Items Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Quantity</th>
                  <th className="text-right p-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {itemPopularity.length > 0 ? (
                  itemPopularity.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.name}</td>
                      <td className="text-right p-2">{item.count}</td>
                      <td className="text-right p-2">${item.revenue.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-4 text-muted-foreground">
                      No items sold for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-right p-2">Items</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-2">{order.id.substring(0, 8)}</td>
                      <td className="p-2">{format(new Date(order.timestamp), 'HH:mm')}</td>
                      <td className="p-2">{order.customer?.name || 'Walk-in Customer'}</td>
                      <td className="text-right p-2">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                      <td className="text-right p-2">${order.totalAmount.toFixed(2)}</td>
                      <td className="p-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", {
                          "bg-yellow-100 text-yellow-800": order.status === 'pending',
                          "bg-blue-100 text-blue-800": order.status === 'in-progress',
                          "bg-green-100 text-green-800": order.status === 'completed',
                          "bg-red-100 text-red-800": order.status === 'cancelled',
                        })}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-muted-foreground">
                      No orders found for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyReports;
