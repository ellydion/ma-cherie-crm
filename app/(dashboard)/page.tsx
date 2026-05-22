'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Coffee, Users, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [avgCheck, setAvgCheck] = useState(0);
  const [guestsToday, setGuestsToday] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Основные метрики за сегодня
    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at, table_number')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    const revenue = orders?.reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0;
    const orderCount = orders?.length || 0;
    const avg = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

    setTodayRevenue(revenue);
    setTodayOrders(orderCount);
    setAvgCheck(avg);
    setGuestsToday(orderCount * 2); // приблизительно
    setRecentOrders(orders?.slice(0, 5) || []);
    setLoading(false);
  };

  if (loading) {
    return <p className="text-white text-center py-12">Загрузка дашборда...</p>;
  }

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-semibold tracking-tighter text-white">Ma Cherie</h1>
          <p className="text-[#C8A77E] text-2xl">Добро пожаловать обратно!</p>
        </div>

        <Link
          href="/pos"
          className="btn-primary flex items-center gap-4 px-10 py-6 text-2xl shadow-2xl hover:scale-105 transition-all"
        >
          <Coffee className="w-8 h-8" />
          Новый заказ
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#C8A77E] text-sm">Выручка сегодня</p>
              <p className="text-6xl font-mono text-white mt-3">{todayRevenue.toLocaleString('ru-RU')} с</p>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        <div className="card p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#C8A77E] text-sm">Заказов сегодня</p>
              <p className="text-6xl font-mono text-white mt-3">{todayOrders}</p>
            </div>
            <Calendar className="w-10 h-10 text-[#C8A77E]" />
          </div>
        </div>

        <div className="card p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#C8A77E] text-sm">Средний чек</p>
              <p className="text-6xl font-mono text-white mt-3">{avgCheck} с</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="card p-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#C8A77E] text-sm">Посетителей</p>
              <p className="text-6xl font-mono text-white mt-3">{guestsToday}</p>
            </div>
            <Users className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Последние заказы */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Последние заказы</h2>
          <Link href="/reports" className="text-[#C8A77E] hover:underline text-sm flex items-center gap-1">
            Все отчёты →
          </Link>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5C4030]">
                <th className="text-left p-6">Время</th>
                <th className="text-left p-6">Стол</th>
                <th className="text-left p-6">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70">
                  <td className="p-6 text-gray-400">
                    {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-6 font-medium text-white">{order.table_number}</td>
                  <td className="p-6 font-mono text-[#C8A77E] text-xl">{order.total} с</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-gray-400">
                    Пока нет заказов за сегодня
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}