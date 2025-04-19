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
    status: dbOrder.status as OrderStatus,
    timestamp: dbOrder.created_at,
    customer
  };
};

// Convert application menu item to Supabase format
const convertMenuItemToDbFormat = (menuItem: Omit<MenuItem, 'id'>) => {
  return {
    name: menuItem.name,
    description: menuItem.description,
    price: menuItem.price,
    category: menuItem.category,
    image_url: menuItem.imageUrl || 'https://placehold.co/300x300?text=No+Image',
    updated_at: new Date().toISOString()
  };
};

// Convert Supabase menu item to application format
const convertDbMenuItemToAppFormat = (dbItem: any): MenuItem => {
  return {
    id: dbItem.id,
    name: dbItem.name,
    description: dbItem.description || '',
    price: dbItem.price,
    category: dbItem.category,
    imageUrl: dbItem.image_url || 'https://placehold.co/300x300?text=No+Image'
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

export const fetchOrdersByDateRange = async (startDate: string, endDate: string): Promise<Order[]> => {
  try {
    console.log(`Fetching orders from ${startDate} to ${endDate}...`);
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders by date range:', ordersError);
      toast({
        title: "Error fetching orders",
        description: ordersError.message,
        variant: "destructive",
      });
      return [];
    }

    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found in date range');
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
    console.error('Unexpected error fetching orders by date range:', error);
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
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after status update');
      return false;
    }

    console.log('Order status updated successfully:', data);
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
    return data.map(item => convertDbMenuItemToAppFormat(item));
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

export const addMenuItemToDatabase = async (item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> => {
  try {
    console.log('Adding menu item to database:', item);
    const dbItem = convertMenuItemToDbFormat(item);
    
    // Console log the full payload for debugging
    console.log('Database payload:', dbItem);
    
    const { data, error } = await supabase
      .from('menu_items')
      .insert(dbItem)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "Error saving menu item",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    if (!data) {
      console.error('No menu item data returned after insert');
      toast({
        title: "Error saving menu item",
        description: "No data returned after item creation.",
        variant: "destructive",
      });
      return null;
    }

    console.log('Menu item added successfully:', data);
    
    // Convert to application format and return
    return convertDbMenuItemToAppFormat(data);
  } catch (error: any) {
    console.error('Unexpected error adding menu item:', error);
    toast({
      title: "Error saving menu item",
      description: error.message || "An unexpected error occurred while saving the menu item.",
      variant: "destructive",
    });
    return null;
  }
};

export const updateMenuItemInDatabase = async (id: string, updates: Partial<MenuItem>): Promise<boolean> => {
  try {
    console.log(`Updating menu item ${id}:`, updates);
    
    // Convert updates to database format
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    
    // Set updated_at timestamp
    dbUpdates.updated_at = new Date().toISOString();
    
    // Log full payload for debugging
    console.log('Database update payload:', dbUpdates);
    
    // Perform the update and return the updated record
    const { data, error } = await supabase
      .from('menu_items')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "Error updating menu item",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after update, item might not exist');
      toast({
        title: "Error updating menu item",
        description: "Item could not be found or updated",
        variant: "destructive",
      });
      return false;
    }

    console.log('Menu item updated successfully:', data);
    return true;
  } catch (error: any) {
    console.error('Unexpected error updating menu item:', error);
    toast({
      title: "Error updating menu item", 
      description: error.message || "An unexpected error occurred while updating the menu item.",
      variant: "destructive",
    });
    return false;
  }
};

export const deleteMenuItemFromDatabase = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting menu item ${id}`);
    const { data, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error('No data returned after delete, item might not exist');
      return false;
    }

    console.log('Menu item deleted successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error deleting menu item:', error);
    return false;
  }
};
