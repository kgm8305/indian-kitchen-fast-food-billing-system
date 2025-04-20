
import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { format, subDays, startOfDay, endOfDay, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  DownloadIcon, 
  CalendarIcon, 
  FilterIcon,
  SearchIcon,
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

const OrderReports = () => {
  const { orders, refreshOrders, loading } = useData();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Filter orders based on date range, status, and search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      
      // Date range filter
      const afterFrom = !date.from || orderDate >= startOfDay(date.from);
      const beforeTo = !date.to || orderDate <= endOfDay(date.to);
      const inDateRange = afterFrom && beforeTo;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Search term filter
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return inDateRange && matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, date, statusFilter, searchTerm]);

  const handleRefresh = () => {
    refreshOrders();
    toast({
      title: "Data Refreshed",
      description: "Order reports have been updated with the latest data",
    });
  };

  const downloadOrderReport = () => {
    try {
      setDownloadingReport(true);
      
      // Create headers for CSV
      const headers = [
        'Order ID', 
        'Date', 
        'Time', 
        'Customer', 
        'Items', 
        'Total Amount', 
        'Status'
      ];
      
      // Prepare data rows for CSV
      const csvRows = [
        headers.join(','),
        ...filteredOrders.map(order => {
          const orderDate = new Date(order.timestamp);
          const date = format(orderDate, 'yyyy-MM-dd');
          const time = format(orderDate, 'HH:mm:ss');
          const customer = order.customer?.name || 'Walk-in Customer';
          const items = order.items.map(item => `${item.quantity}x ${item.name}`).join('; ');
          const total = order.totalAmount.toFixed(2);
          
          return [
            order.id,
            date,
            time,
            `"${customer}"`, // Add quotes to handle commas in names
            `"${items}"`, // Add quotes to handle commas in item list
            total,
            order.status
          ].join(',');
        })
      ];
      
      // Join rows with newlines to create CSV content
      const csvContent = csvRows.join('\n');
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `order-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report Downloaded",
        description: "Order report has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error Downloading Report",
        description: "Failed to download order report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date.from ? format(date.from, 'PP') : 'From'} - 
                {date.to ? format(date.to, 'PP') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(range) => setDate(range || {from: undefined, to: undefined})}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
            >
              <SelectTrigger>
                <div className="flex items-center">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={downloadOrderReport} 
              variant="secondary"
              disabled={downloadingReport || filteredOrders.length === 0}
            >
              <DownloadIcon className={`h-4 w-4 mr-2 ${downloadingReport ? 'animate-spin' : ''}`} />
              Download Report
            </Button>
            
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Order Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="font-medium p-3">Order ID</th>
                    <th className="font-medium p-3">Date</th>
                    <th className="font-medium p-3">Customer</th>
                    <th className="font-medium p-3">Items</th>
                    <th className="font-medium p-3 text-right">Total</th>
                    <th className="font-medium p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">Loading order data...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 font-mono text-xs">{order.id.substring(0, 12)}...</td>
                        <td className="p-3">{format(new Date(order.timestamp), 'MMM d, yyyy HH:mm')}</td>
                        <td className="p-3">{order.customer?.name || 'Walk-in Customer'}</td>
                        <td className="p-3">
                          <div className="max-w-[300px] truncate">
                            {order.items.map((item, i) => (
                              <span key={i} className="block truncate">
                                {item.quantity}x {item.name}
                              </span>
                            )).slice(0, 2)}
                            {order.items.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{order.items.length - 2} more items
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">${order.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(order.status))}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredOrders.length} orders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">
                  {filteredOrders.filter(o => o.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-medium">
                  {filteredOrders.filter(o => o.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Progress:</span>
                <span className="font-medium">
                  {filteredOrders.filter(o => o.status === 'in-progress').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancelled:</span>
                <span className="font-medium">
                  {filteredOrders.filter(o => o.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderReports;
