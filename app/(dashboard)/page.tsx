'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Coffee, TrendingUp, Calendar } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [avgCheck, setAvgCheck] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [soldToday, setSoldToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, created_at, payment_method, table_number')
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (!orders) {
      setLoading(false);
      return;
    }

    const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const orderCount = orders.length;
    const avg = orderCount > 0 ? Math.round(revenue / orderCount) : 0;

    // Разделение по типу оплаты
    const cash = orders
      .filter(o => o.payment_method === 'cash')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const transfer = orders
      .filter(o => o.payment_method === 'transfer')
      .reduce((sum, o) => sum + Number(o.total), 0);

    setTodayRevenue(revenue);
    setTodayOrders(orderCount);
    setAvgCheck(avg);
    setCashAmount(cash);
    setTransferAmount(transfer);
    setRecentOrders(orders.slice(0, 8));

    const ids = orders.map((o: any) => o.id).filter(Boolean);
    if (ids.length) {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity, price')
        .in('order_id', ids);
      const map = new Map<string, { product_name: string; qty: number; revenue: number }>();
      (items || []).forEach((row: any) => {
        const cur = map.get(row.product_name) || { product_name: row.product_name, qty: 0, revenue: 0 };
        cur.qty += Number(row.quantity);
        cur.revenue += Number(row.quantity) * Number(row.price);
        map.set(row.product_name, cur);
      });
      setSoldToday(Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 12));
    } else {
      setSoldToday([]);
    }

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
              <p className="text-[#C8A77E] text-sm mb-1">Оплата сегодня</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Наличка</span>
                  <span className="font-mono text-white">{cashAmount} с</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">Перевод</span>
                  <span className="font-mono text-white">{transferAmount} с</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card overflow-hidden">
        <h2 className="text-2xl font-semibold text-white p-6">Что продали сегодня</h2>
        {soldToday.length === 0 ? (
          <p className="p-8 text-gray-400">Пока нет продаж за сегодня</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-t border-[#5C4030] text-left">
                <th className="p-4">Позиция</th>
                <th className="p-4">Кол-во</th>
                <th className="p-4">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {soldToday.map((row: any) => (
                <tr key={row.product_name} className="border-t border-[#5C4030]">
                  <td className="p-4 text-white">{row.product_name}</td>
                  <td className="p-4 font-mono">{row.qty}</td>
                  <td className="p-4 font-mono text-[#C8A77E]">{row.revenue} с</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
                <th className="text-left p-6">Оплата</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-400">
                    Сегодня заказов ещё нет
                  </td>
                </tr>
              )}

              {recentOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-[#5C4030] hover:bg-[#3F2A1F]/70">
                  <td className="p-6 text-gray-400">
                    {new Date(order.created_at).toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                  <td className="p-6 font-medium text-white">{order.table_number}</td>
                  <td className="p-6 font-mono text-[#C8A77E] text-xl">{order.total} с</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-3xl text-sm font-medium ${
                      order.payment_method === 'cash' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {order.payment_method === 'cash' ? 'Наличка' : 'Перевод'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}