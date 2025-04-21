import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order, OrderStatus } from '@/types';
import { 
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat
} from 'lucide-react';

interface OrderItemProps {
  order: Order;
}

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  const { updateOrderStatus } = useData();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStatusIcon = (status: OrderStatus) => {
    switch(status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <ChefHat className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleStatusChange = (newStatus: string) => {
    updateOrderStatus(order.id, newStatus as OrderStatus);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <span>Order #{order.id}</span>
            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </CardTitle>
          <div className="flex items-center">
            {getStatusIcon(order.status)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(order.timestamp).toLocaleString()}
        </div>
        {order.customer && (
          <div className="text-sm">
            Customer: {order.customer.name}
            {order.customer.contact && ` • ${order.customer.contact}`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs underline text-muted-foreground"
            >
              {isExpanded ? 'Hide details' : `${order.items.length} items - Show details`}
            </Button>
            <div className="font-bold">
              Total: ₹{order.totalAmount.toFixed(2)}
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-2 space-y-1 border-t pt-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4 pt-2 border-t">
            <div className="flex items-center space-x-2 w-full">
              <span className="text-sm">Status:</span>
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={order.status === 'cancelled'}
              >
                <SelectTrigger className="h-8 w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItem;
