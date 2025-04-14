import { supabase } from '@/integrations/supabase/client';
import { MenuItem, Order, OrderItem, Customer, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

// Convert application order to Supabase format
const convertOrderToDbFormat = (order: Omit<Order, 'id' | 'timestamp'>) => {
  return {
    customer_name: order.customer?.name || null,
    customer_contact: order.customer?.contact || null,
    total_amount: order.totalAmount,
    status: order.status
  };
};

// Convert application order item to Supabase format
const convertOrderItemToDbFormat = (orderItem: OrderItem, orderId: string) => {
  return {
    order_id: orderId,
    menu_item_id: orderItem.menuItemId,
    name: orderItem.name,
    price: orderItem.price,
    quantity: orderItem.quantity,
    subtotal: orderItem.subtotal
  };
};

// Convert Supabase order to application format
const convertDbOrderToAppFormat = (dbOrder: any, orderItems: any[]): Order => {
  const appOrderItems: OrderItem[] = orderItems.map(item => ({
    menuItemId: item.menu_item_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal
  }));

  const customer: Customer | undefined = dbOrder.customer_name 
    ? {
        name: dbOrder.customer_name,
        contact: dbOrder.customer_contact || ''
      }
    : undefined;

  return {
    id: dbOrder.id,
    items: appOrderItems,
    totalAmount: dbOrder.total_amount,
    status: dbOrder.status,
    timestamp: dbOrder.created_at,
    customer
  };
};

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    console.log('Fetching orders from database...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      toast({
        title: "Error fetching orders",
        description: ordersError.message,
        variant: "destructive",
      });
      return [];
    }

    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found in database');
      return [];
    }

    console.log('Orders fetched successfully:', ordersData.length);
    
    // Fetch order items for all orders
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', ordersData.map(order => order.id));
    
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      toast({
        title: "Error fetching order details",
        description: orderItemsError.message,
        variant: "destructive",
      });
      return [];
    }

    // Group order items by order_id
    const orderItemsMap = new Map<string, any[]>();
    orderItemsData?.forEach(item => {
      if (!orderItemsMap.has(item.order_id)) {
        orderItemsMap.set(item.order_id, []);
      }
      orderItemsMap.get(item.order_id)?.push(item);
    });

    // Convert to application format
    const orders = ordersData.map(dbOrder => {
      const orderItems = orderItemsMap.get(dbOrder.id) || [];
      return convertDbOrderToAppFormat(dbOrder, orderItems);
    });

    return orders;
  } catch (error) {
    console.error('Unexpected error fetching orders:', error);
    toast({
      title: "Error loading orders",
      description: "An unexpected error occurred while loading orders.",
      variant: "destructive",
    });
    return [];
  }
};

export const createOrderInDatabase = async (order: Omit<Order, 'id' | 'timestamp'>): Promise<Order | null> => {
  try {
    console.log('Creating order in database:', order);
    const dbOrder = convertOrderToDbFormat(order);
    
    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(dbOrder)
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      toast({
        title: "Error creating order",
        description: orderError.message,
        variant: "destructive",
      });
      return null;
    }

    if (!orderData) {
      console.error('No order data returned after insert');
      toast({
        title: "Error creating order",
        description: "No data returned after order creation.",
        variant: "destructive",
      });
      return null;
    }

    console.log('Order created successfully:', orderData);
    
    // Insert order items
    const orderItems = order.items.map(item => convertOrderItemToDbFormat(item, orderData.id));
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      // Attempt to delete the order if items failed
      await supabase.from('orders').delete().eq('id', orderData.id);
      toast({
        title: "Error creating order items",
        description: orderItemsError.message,
        variant: "destructive",
      });
      return null;
    }

    console.log('Order items created successfully');
    
    // Return the created order in application format
    return {
      id: orderData.id,
      items: order.items,
      totalAmount: orderData.total_amount,
      status: orderData.status as OrderStatus,
      timestamp: orderData.created_at,
      customer: order.customer
    };
  } catch (error) {
    console.error('Unexpected error creating order:', error);
    toast({
      title: "Error creating order",
      description: "An unexpected error occurred while creating the order.",
      variant: "destructive",
    });
    return null;
  }
};

export const updateOrderStatusInDatabase = async (id: string, status: OrderStatus): Promise<boolean> => {
  try {
    console.log(`Updating order ${id} status to ${status}`);
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    console.log('Order status updated successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error updating order status:', error);
    toast({
      title: "Error updating order",
      description: "An unexpected error occurred while updating the order.",
      variant: "destructive",
    });
    return false;
  }
};

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  try {
    console.log('Fetching menu items from database...');
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error fetching menu",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No menu items found in database');
      return [];
    }

    console.log('Menu items fetched successfully:', data.length);
    
    // Convert to application format
    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category,
      imageUrl: item.image_url || 'https://placehold.co/300x300?text=No+Image'
    }));
  } catch (error) {
    console.error('Unexpected error fetching menu items:', error);
    toast({
      title: "Error loading menu",
      description: "An unexpected error occurred while loading the menu.",
      variant: "destructive",
    });
    return [];
  }
};
