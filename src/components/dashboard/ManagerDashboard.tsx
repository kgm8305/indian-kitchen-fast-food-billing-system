import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatus } from '@/types';
import { 
  Clock, 
  Check, 
  XCircle,
  Activity
} from 'lucide-react';

const ManagerDashboard = () => {
  const { orders, updateOrderStatus } = useData();

  // Get active orders (pending or in-progress)
  const activeOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'in-progress'
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculate statistics
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const inProgressOrders = orders.filter(order => order.status === 'in-progress').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      
      {/* Order Statistics */}
      <div className="stats-grid">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        <div className="space-y-4">
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.timestamp).toLocaleString()} • 
                    {order.customer ? ` ${order.customer.name}` : ' Walk-in Customer'}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {order.status === 'pending' && (
                      <Button 
                        onClick={() => handleStatusUpdate(order.id, 'in-progress')}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'in-progress') && (
                      <Button 
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Mark as Completed
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'in-progress') && (
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="text-red-500 border-red-200 hover:bg-red-50"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No active orders at the moment.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
