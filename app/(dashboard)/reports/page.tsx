'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type DayPoint = { label: string; sales: number; cash: number; transfer: number; orders: number };

export default function ReportsPage() {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [points, setPoints] = useState<DayPoint[]>([]);
  const [buy, setBuy] = useState(0);

  useEffect(() => {
    const load = async () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - (days - 1));
      const { data: orders } = await supabase.from('orders').select('total, payment_method, created_at').gte('created_at', from.toISOString());
      const { data: deliveries } = await supabase.from('deliveries').select('total_amount, delivery_date').gte('delivery_date', from.toISOString().slice(0, 10));
      setBuy((deliveries || []).reduce((s: number, d: any) => s + Number(d.total_amount), 0));

      const map = new Map<string, DayPoint>();
      for (let i = 0; i < days; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        map.set(key, { label: `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`, sales: 0, cash: 0, transfer: 0, orders: 0 });
      }
      (orders || []).forEach((o: any) => {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        const row = map.get(key);
        if (!row) return;
        const t = Number(o.total);
        row.sales += t;
        row.orders += 1;
        if (o.payment_method === 'cash') row.cash += t;
        if (o.payment_method === 'transfer') row.transfer += t;
      });
      setPoints(Array.from(map.values()));
    };
    load();
  }, [days]);

  const sales = points.reduce((s, p) => s + p.sales, 0);
  const cash = points.reduce((s, p) => s + p.cash, 0);
  const transfer = points.reduce((s, p) => s + p.transfer, 0);
  const max = Math.max(1, ...points.map((p) => p.sales));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-semibold">Отчёты</h1>
        <div className="flex gap-2">
          {([7, 14, 30] as const).map((n) => (
            <button key={n} type="button" onClick={() => setDays(n)} className={`px-5 py-3 rounded-3xl ${days === n ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#3F2A1F]'}`}>{n} дней</button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card p-6"><p className="text-[#C8A77E]">Продажи</p><p className="text-3xl font-mono">{sales} с</p></div>
        <div className="card p-6"><p className="text-[#C8A77E]">Закуп</p><p className="text-3xl font-mono">{buy} с</p></div>
        <div className="card p-6"><p className="text-emerald-400">Наличка</p><p className="text-3xl font-mono">{cash} с</p></div>
        <div className="card p-6"><p className="text-blue-400">Перевод</p><p className="text-3xl font-mono">{transfer} с</p></div>
      </div>
      <div className="card p-6">
        <p className="mb-4 text-[#C8A77E]">Выручка по дням</p>
        <div className="flex items-end gap-1 h-56">
          {points.map((p) => (
            <div key={p.label} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full bg-[#C8A77E] rounded-t-lg" style={{ height: `${Math.round((p.sales / max) * 100)}%`, minHeight: p.sales ? 6 : 2 }} title={`${p.label}: ${p.sales} с`} />
              <span className="text-[10px] text-gray-400 mt-1 rotate-0">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
