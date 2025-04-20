
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, Search } from 'lucide-react';
import { fetchOrdersByDateRange } from '@/utils/databaseOperations';
import { Order, OrderStatus } from '@/types';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

type DateRange = {
  from: Date;
  to?: Date | undefined;
};

const OrderReports = () => {
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: new Date(new Date().setDate(new Date().getDate() - 30)), 
    to: new Date() 
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let startDate = dateRange.from.toISOString();
      // If no end date is set, use current date
      let endDate = dateRange.to ? dateRange.to.toISOString() : new Date().toISOString();
      
      // Adjust end date to include the entire day
      if (dateRange.to) {
        const adjustedEndDate = new Date(dateRange.to);
        adjustedEndDate.setHours(23, 59, 59, 999);
        endDate = adjustedEndDate.toISOString();
      }
      
      const ordersData = await fetchOrdersByDateRange(startDate, endDate);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders for report:', error);
      toast({
        title: "Error loading orders",
        description: "Failed to load order data for report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const handleDateRangeChange = (range: DateRange) => {
    // Ensure we have a complete range with both from and to dates
    const newRange: DateRange = {
      from: range.from,
      to: range.to || range.from // Default to from date if to is not provided
    };
    setDateRange(newRange);
  };
  
  const downloadReport = () => {
    try {
      // Filter orders based on current filters
      const filteredOrders = getFilteredOrders();
      
      // Create CSV content
      const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total Amount', 'Status'];
      const csvRows = [
        headers.join(',')
      ];
      
      filteredOrders.forEach(order => {
        const row = [
          order.id,
          new Date(order.timestamp).toLocaleDateString(),
          order.customer?.name || 'Walk-in',
          order.items.length,
          order.totalAmount.toFixed(2),
          order.status
        ];
        
        // Escape commas in fields
        const escapedRow = row.map(field => {
          const stringField = String(field);
          return stringField.includes(',') ? `"${stringField}"` : stringField;
        });
        
        csvRows.push(escapedRow.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      // Create and download the file
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
        title: "Download Failed",
        description: "Could not download the order report",
        variant: "destructive"
      });
    }
  };
  
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = 
        searchTerm === '' || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (order.customer?.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
  };
  
  const filteredOrders = getFilteredOrders();
  
  const calculateTotalSales = () => {
    return filteredOrders.reduce((sum, order) => {
      if (order.status !== 'cancelled') {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);
  };
  
  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch(status) {
      case 'pending': return 'secondary';
      case 'in-progress': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full sm:w-[300px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, yyyy")} - {format(dateRange.to, "LLL dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range) {
                    handleDateRangeChange(range);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchOrders} disabled={loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={downloadReport}
            disabled={filteredOrders.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculateTotalSales().toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredOrders.length > 0 
                ? (calculateTotalSales() / filteredOrders.length).toFixed(2) 
                : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found for the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>{new Date(order.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>{order.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderReports;
