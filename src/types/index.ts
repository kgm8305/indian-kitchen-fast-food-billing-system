
export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface Customer {
  name: string;
  contact: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: string;
  customer?: Customer;
}
