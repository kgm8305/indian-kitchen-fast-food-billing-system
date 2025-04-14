
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Order, OrderStatus } from '@/types';
import { toast } from '@/hooks/use-toast';

// Sample food categories
export const FOOD_CATEGORIES = [
  'Burger', 'Pizza', 'Sides', 'Drinks', 'Dessert'
];

// Mock initial menu items
const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with melted cheese, lettuce, tomato, and special sauce',
    price: 8.99,
    category: 'Burger',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
    price: 12.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: '3',
    name: 'French Fries',
    description: 'Crispy golden fries served with ketchup',
    price: 3.99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: '4',
    name: 'Chocolate Milkshake',
    description: 'Rich and creamy chocolate milkshake topped with whipped cream',
    price: 4.99,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: '5',
    name: 'Chicken Wings',
    description: 'Spicy buffalo chicken wings served with blue cheese dip',
    price: 9.99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    id: '6',
    name: 'Chocolate Brownie',
    description: 'Warm chocolate brownie with vanilla ice cream',
    price: 5.99,
    category: 'Dessert',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
];

interface DataContextType {
  menuItems: MenuItem[];
  orders: Order[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  createOrder: (order: Omit<Order, 'id' | 'timestamp'>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Load initial data from localStorage or use default data
    const storedMenuItems = localStorage.getItem('menuItems');
    if (storedMenuItems) {
      setMenuItems(JSON.parse(storedMenuItems));
    } else {
      setMenuItems(INITIAL_MENU_ITEMS);
      localStorage.setItem('menuItems', JSON.stringify(INITIAL_MENU_ITEMS));
    }

    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (menuItems.length > 0) {
      localStorage.setItem('menuItems', JSON.stringify(menuItems));
    }
  }, [menuItems]);

  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('orders', JSON.stringify(orders));
    }
  }, [orders]);

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setMenuItems(prev => [...prev, newItem]);
    toast({
      title: "Success",
      description: `${item.name} has been added to the menu.`,
    });
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
    toast({
      title: "Success",
      description: "Menu item has been updated.",
    });
  };

  const deleteMenuItem = (id: string) => {
    const itemName = menuItems.find(item => item.id === id)?.name;
    setMenuItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: `${itemName || 'Item'} has been removed from the menu.`,
    });
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'timestamp'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: "Order Created",
      description: `Order #${newOrder.id} has been created successfully.`,
    });
    return newOrder;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === id ? { ...order, status } : order
      )
    );
    toast({
      title: "Status Updated",
      description: `Order #${id} is now ${status}.`,
    });
  };

  return (
    <DataContext.Provider value={{ 
      menuItems, 
      orders, 
      addMenuItem, 
      updateMenuItem, 
      deleteMenuItem, 
      createOrder, 
      updateOrderStatus 
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
