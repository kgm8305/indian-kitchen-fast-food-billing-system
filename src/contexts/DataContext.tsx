import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { fetchMenuItems, fetchOrders, createOrderInDatabase, updateOrderStatusInDatabase, updateMenuItemInDatabase, addMenuItemToDatabase, deleteMenuItemFromDatabase } from '@/utils/databaseOperations';

// Sample food categories
export const FOOD_CATEGORIES = [
  'Rice FastFood',
  'Noodles FastFood',
  'Tiffins',
  'Starters',
  'Beverages',
  "Biryani's"
];

interface DataContextType {
  menuItems: MenuItem[];
  orders: Order[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshMenuItems: () => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const items = await fetchMenuItems();
        if (items.length > 0) {
          setMenuItems(items);
        }
        
        const ordersData = await fetchOrders();
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshOrders = async () => {
    setLoading(true);
    try {
      const ordersData = await fetchOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMenuItems = async () => {
    setLoading(true);
    try {
      console.log("Refreshing menu items...");
      const items = await fetchMenuItems();
      console.log("Refreshed menu items:", items);
      setMenuItems(items);
    } catch (error) {
      console.error('Error refreshing menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      setLoading(true);
      const newItem = await addMenuItemToDatabase(item);
      if (newItem) {
        setMenuItems(prev => [...prev, newItem]);
        
        toast({
          title: "Success",
          description: `${item.name} has been added to the menu.`,
        });
        
        await refreshMenuItems();
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "Error",
        description: "Failed to add menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Updating menu item in context:', id, updates);
      
      const success = await updateMenuItemInDatabase(id, updates);
      console.log('Database update result:', success);
      
      if (success) {
        setMenuItems(prev => 
          prev.map(item => 
            item.id === id ? { ...item, ...updates } : item
          )
        );
        
        toast({
          title: "Success",
          description: "Menu item has been updated.",
        });
        
        await refreshMenuItems();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      setLoading(true);
      const itemName = menuItems.find(item => item.id === id)?.name;
      const success = await deleteMenuItemFromDatabase(id);
      if (success) {
        setMenuItems(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Success",
          description: `${itemName || 'Item'} has been removed from the menu.`,
        });
        
        await refreshMenuItems();
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'timestamp'>) => {
    try {
      const newOrder = await createOrderInDatabase(orderData);
      
      if (newOrder) {
        setOrders(prev => [newOrder, ...prev]);
        
        toast({
          title: "Order Created",
          description: `Order #${newOrder.id} has been created successfully.`,
        });
        
        return newOrder;
      }
      return null;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error Creating Order",
        description: "Failed to create the order. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      setLoading(true);
      const success = await updateOrderStatusInDatabase(id, status);
      
      if (success) {
        setOrders(prev => 
          prev.map(order => 
            order.id === id ? { ...order, status } : order
          )
        );
        
        toast({
          title: "Status Updated",
          description: `Order #${id} is now ${status}.`,
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error Updating Status",
        description: "Failed to update the order status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{ 
      menuItems, 
      orders, 
      addMenuItem, 
      updateMenuItem, 
      deleteMenuItem, 
      createOrder, 
      updateOrderStatus,
      refreshOrders,
      refreshMenuItems,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
