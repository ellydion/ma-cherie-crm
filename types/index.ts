// ======================
// Основные типы проекта Ma Cherie CRM
// ======================

export type UserRole = 'admin' | 'barista' | 'kitchen' | 'manager';

export type OrderStatus = 'open' | 'closed' | 'cancelled';

export type InventorySection = 'coffee' | 'kitchen';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Пример будущего типа заказа (будем расширять)
export interface Order {
  id: string;
  table_number?: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  ingredients?: string[];
}

// Тип для склада
export interface InventoryItem {
  id: string;
  name: string;
  section: InventorySection;
  unit: 'kg' | 'liter' | 'piece' | 'pack';
  quantity: number;
  min_threshold: number;
  last_updated: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  loyalty_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  total_spent: number;
}