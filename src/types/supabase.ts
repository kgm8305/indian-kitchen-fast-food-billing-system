
// Define types for working with Supabase data without modifying the auto-generated types

import { UserRole } from '.';

export interface ProfileResponse {
  id: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderResponse {
  id: string;
  customer_name: string | null;
  customer_contact: string | null;
  total_amount: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItemResponse {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  created_at?: string;
}
