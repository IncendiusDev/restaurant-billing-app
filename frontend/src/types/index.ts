export type UserRole = 'super_admin' | 'restaurant_admin' | 'waiter'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  restaurantId: number | null
}

export interface Restaurant {
  id: number
  name: string
  slug: string
  address?: string
  phone?: string
  email?: string
}

export interface MenuItem {
  id: number
  name: string
  price: string | number
  description?: string
  image_url?: string
  category_name?: string
  is_available?: boolean
}

export interface Table {
  id: number
  table_number: number
  capacity: number
  status: 'free' | 'occupied' | 'reserved'
}

export interface Waiter {
  id: number
  name: string
  email: string
  is_active: boolean
}

export interface OrderItem {
  id?: number
  menu_item_id?: number
  name: string
  price: string | number
  quantity: number
  notes?: string
}

export interface Order {
  id: number
  table_id: number | null
  waiter_id: number | null
  customer_name: string | null
  order_type: 'dine_in' | 'online'
  status: 'open' | 'billed' | 'paid' | 'cancelled'
  tax_pct: string | number
  discount: string | number
  created_at: string
  paid_at?: string | null
  items: OrderItem[]
  totals?: OrderTotals
}

export interface OrderTotals {
  subtotal: number
  discount: number
  tax: number
  total: number
}

export interface Invoice {
  id: number
  order_id: number
  invoice_number: string
  subtotal: string | number
  discount: string | number
  tax: string | number
  total: string | number
  payment_status: 'unpaid' | 'paid'
  payment_method?: string
  issued_at: string
  paid_at?: string | null
  order?: {
    id: number
    tableId: number | null
    customerName: string | null
    items: OrderItem[]
  }
  restaurant?: { name: string; address?: string; phone?: string }
}
