// lib/store/ordersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Order {
  id: string;
  timestamp: string;
  items: string[];
  total: number;
  table?: string;
}

interface OrdersStore {
  orders: Order[];
  todayRevenue: number;
  todayOrdersCount: number;
  todayGuests: number;

  addOrder: (order: Omit<Order, 'id' | 'timestamp'>) => void;
  clearTodayStats: () => void;
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set) => ({
      orders: [],
      todayRevenue: 48750,
      todayOrdersCount: 47,
      todayGuests: 29,

      addOrder: (orderData) => {
        const newOrder: Order = {
          id: 'ORD-' + Date.now().toString().slice(-6),
          timestamp: new Date().toLocaleString('ru-RU'),
          ...orderData,
        };

        set((state) => ({
          orders: [newOrder, ...state.orders],
          todayRevenue: state.todayRevenue + orderData.total,
          todayOrdersCount: state.todayOrdersCount + 1,
          todayGuests: state.todayGuests + Math.floor(Math.random() * 2) + 1,
        }));
      },

      clearTodayStats: () => set({ todayRevenue: 0, todayOrdersCount: 0, todayGuests: 0 }),
    }),
    {
      name: 'ma-cherie-orders',
    }
  )
);