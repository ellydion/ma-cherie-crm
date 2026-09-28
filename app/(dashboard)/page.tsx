'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coffee } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [avg, setAvg] = useState(0);
  const [cash, setCash] = useState(0);
  const [transfer, setTransfer] = useState(0);
  const [sold, setSold] = useState<{ name: string; qty: number; sum: number }[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, created_at, payment_method, table_number')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false });

    const list = orders || [];
    const rev = list.reduce((s, o) => s + Number(o.total), 0);
    setRevenue(rev);
    setOrdersCount(list.length);
    setAvg(list.length ? Math.round(rev / list.length) : 0);
    setCash(list.filter((o) => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total), 0));
    setTransfer(list.filter((o) => o.payment_method === 'transfer').reduce((s, o) => s + Number(o.total), 0));
    setRecent(list.slice(0, 8));

    const ids = list.map((o) => o.id);
    if (ids.length) {
      const { data: items } = await supabase.from('order_items').select('product_name, quantity, price').in('order_id', ids);
      const map = new Map<string, { name: string; qty: number; sum: number }>();
      (items || []).forEach((row: any) => {
        const cur = map.get(row.product_name) || { name: row.product_name, qty: 0, sum: 0 };
        cur.qty += Number(row.quantity);
        cur.sum += Number(row.quantity) * Number(row.price);
        map.set(row.product_name, cur);
      });
      setSold(Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 12));
    } else setSold([]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <p className="text-center py-12">Загрузка...</p>;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-semibold">Ma Cherie</h1>
          <p className="text-[#C8A77E] text-xl mt-1">Что продали сегодня — на всех кассах одно и то же</p>
        </div>
        <Link href="/pos" className="btn-primary px-10 py-5 text-xl flex items-center gap-3">
          <Coffee /> Новый заказ
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="card p-6"><p className="text-[#C8A77E] text-sm">Выручка</p><p className="text-4xl font-mono mt-2">{revenue} с</p></div>
        <div className="card p-6"><p className="text-[#C8A77E] text-sm">Заказы</p><p className="text-4xl font-mono mt-2">{ordersCount}</p></div>
        <div className="card p-6"><p className="text-[#C8A77E] text-sm">Средний чек</p><p className="text-4xl font-mono mt-2">{avg} с</p></div>
        <div className="card p-6">
          <p className="text-[#C8A77E] text-sm mb-2">Оплата</p>
          <p className="text-emerald-400">Наличка {cash} с</p>
          <p className="text-blue-400">Перевод {transfer} с</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card overflow-hidden">
          <h2 className="text-2xl p-6">Продали сегодня</h2>
          {sold.length === 0 ? <p className="p-6 text-gray-400">Пока пусто</p> : (
            <table className="w-full"><thead><tr className="border-t border-[#5C4030] text-left"><th className="p-4">Товар</th><th className="p-4">Кол-во</th><th className="p-4">Сумма</th></tr></thead>
              <tbody>{sold.map((r) => <tr key={r.name} className="border-t border-[#5C4030]"><td className="p-4">{r.name}</td><td className="p-4 font-mono">{r.qty}</td><td className="p-4 font-mono text-[#C8A77E]">{r.sum} с</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div className="card overflow-hidden">
          <h2 className="text-2xl p-6">Последние чеки</h2>
          {recent.length === 0 ? <p className="p-6 text-gray-400">Нет заказов</p> : (
            <table className="w-full"><thead><tr className="border-t border-[#5C4030] text-left"><th className="p-4">Время</th><th className="p-4">Стол</th><th className="p-4">Сумма</th></tr></thead>
              <tbody>{recent.map((o) => (
                <tr key={o.id} className="border-t border-[#5C4030]">
                  <td className="p-4 text-gray-400">{new Date(o.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-4">{o.table_number || '—'}</td>
                  <td className="p-4 font-mono text-[#C8A77E]">{o.total} с</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
