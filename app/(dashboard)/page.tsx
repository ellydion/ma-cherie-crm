'use client';

import { DollarSign, Coffee, Users, TrendingUp, ArrowUpRight, Plus } from 'lucide-react';
import { useOrdersStore } from '@/lib/store/ordersStore';

export default function DashboardPage() {
  const { todayRevenue, todayOrdersCount, todayGuests, orders } = useOrdersStore();

  const averageCheck = todayOrdersCount > 0 ? Math.round(todayRevenue / todayOrdersCount) : 0;
  const lastOrders = orders.slice(0, 5);

  return (
    <div className="max-w-screen-2xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-white">Доброе утро, Айбек!</h1>
          <p className="text-[#C8A77E] mt-2 text-xl">Четверг, 22 мая 2026</p>
        </div>

        <button 
          onClick={() => window.location.href = '/pos'}
          className="btn-primary flex items-center gap-4 text-xl px-10 py-5 rounded-3xl"
        >
          <Plus className="w-7 h-7" />
          Новый заказ
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-7">
          <p className="text-[#C8A77E] text-sm">Выручка сегодня</p>
          <p className="text-4xl font-semibold text-white mt-4">{todayRevenue.toLocaleString('ru-RU')} с</p>
        </div>
        <div className="card p-7">
          <p className="text-[#C8A77E] text-sm">Заказов сегодня</p>
          <p className="text-4xl font-semibold text-white mt-4">{todayOrdersCount}</p>
        </div>
        <div className="card p-7">
          <p className="text-[#C8A77E] text-sm">Средний чек</p>
          <p className="text-4xl font-semibold text-white mt-4">{averageCheck} с</p>
        </div>
        <div className="card p-7">
          <p className="text-[#C8A77E] text-sm">Гостей сегодня</p>
          <p className="text-4xl font-semibold text-white mt-4">{todayGuests}</p>
        </div>
      </div>

      {/* Последние заказы */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Последние заказы</h2>
        <div className="space-y-4">
          {lastOrders.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">Пока нет закрытых заказов</p>
          ) : (
            lastOrders.map((order: any) => (
              <div key={order.id} className="flex justify-between items-center bg-[#2C241E] p-5 rounded-3xl">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-lg text-white">{order.id}</span>
                  <div>
                    <p className="text-white">{order.items.join(', ')}</p>
                    <p className="text-sm text-gray-400">{order.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-2xl text-white">{order.total.toLocaleString('ru-RU')} с</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}