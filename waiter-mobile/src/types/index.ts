export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'restaurant_admin' | 'waiter';
  restaurantId: number;
}

export interface Table {
  id: number;
  restaurant_id: number;
  table_number: string;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved';
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  price: number | string;
  category_name?: string;
  description?: string;
  image_url?: string;
  is_available: boolean;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  menu_item_id: number;
  name: string;
  price: number | string;
  quantity: number;
  notes?: string | null;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Order {
  id: number;
  restaurant_id: number;
  table_id: number | null;
  waiter_id: number | null;
  customer_name: string | null;
  customer_mobile?: string | null;
  waiting_token?: string | null;
  order_type: 'dine_in' | 'takeaway' | 'online';
  status: 'open' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  tax_pct: number | string;
  discount: number | string;
  created_at: string;
  paid_at?: string | null;
  items: OrderItem[];
  totals?: OrderTotals;
}

export interface Invoice {
  id: number;
  order_id: number;
  restaurant_id: number;
  invoice_number: string;
  subtotal: number | string;
  tax_amount: number | string;
  discount_amount: number | string;
  total_amount: number | string;
  status: 'unpaid' | 'paid';
  payment_method?: 'cash' | 'card' | 'online_desk' | 'upi' | string | null;
  created_at: string;
  paid_at?: string | null;
}
