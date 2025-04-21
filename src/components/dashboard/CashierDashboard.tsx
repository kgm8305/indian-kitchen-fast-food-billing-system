import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatus } from '@/types';
import { 
  PlusCircle, 
  Clock,
  ChefHat,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const CashierDashboard = () => {
  const { orders, updateOrderStatus, refreshOrders, loading } = useData();
  const navigate = useNavigate();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  useEffect(() => {
    refreshOrders();
    setLastRefresh(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const recentOrders = orders
    .filter(order => order.status !== 'cancelled')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const pendingOrders = recentOrders.filter(order => order.status === 'pending');
  const inProgressOrders = recentOrders.filter(order => order.status === 'in-progress');
  const completedOrders = recentOrders.filter(order => order.status === 'completed').slice(0, 5);

  const handleMarkAsServed = async (orderId: string) => {
    await updateOrderStatus(orderId, 'completed');
  };

  const getOrderTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRefresh = () => {
    refreshOrders();
    setLastRefresh(new Date());
  };

  const formatLastRefreshTime = () => {
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatLastRefreshTime()}
          </span>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/new-order')}
            className="bg-brand-orange hover:bg-brand-orange/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Orders waiting to be prepared</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ChefHat className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressOrders.length}</div>
            <p className="text-xs text-muted-foreground">Orders being prepared</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">Orders ready to be served</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Ready for Pickup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-6 bg-white rounded-lg border">
              <div className="flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : inProgressOrders.length > 0 ? (
            inProgressOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle>Order #{order.id}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {getOrderTime(order.timestamp)}
                    </span>
                  </div>
                  <CardDescription>
                    {order.customer?.name || 'Walk-in Customer'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => handleMarkAsServed(order.id)}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Mark as Served
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-6 bg-white rounded-lg border">
              <p className="text-muted-foreground">No orders ready for pickup</p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getOrderTime(order.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No completed orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;
