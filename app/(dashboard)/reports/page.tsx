'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type DayPoint = { key: string; label: string; sales: number; cash: number; transfer: number; orders: number };
type Range = 1 | 3 | 7 | 14 | 30;
type Sold = { name: string; qty: number; sum: number };
type OrderRow = {
  id: string;
  created_at: string;
  total: number;
  payment_method: string | null;
  table_number: string | null;
  items: { name: string; qty: number; price: number }[];
};

function localDayKey(input: Date | string) {
  const d = typeof input === 'string' ? new Date(input) : new Date(input);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ReportsPage() {
  const [days, setDays] = useState<Range>(1);
  const [points, setPoints] = useState<DayPoint[]>([]);
  const [buy, setBuy] = useState(0);
  const [updated, setUpdated] = useState('');
  const [top, setTop] = useState<Sold[]>([]);
  const [ordersByDay, setOrdersByDay] = useState<Record<string, OrderRow[]>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - (days - 1));

      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, payment_method, created_at, table_number')
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: false });

      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('total_amount, delivery_date')
        .gte('delivery_date', from.toISOString().slice(0, 10));

      const list = orders || [];
      const ids = list.map((o) => o.id);
      const { data: items } = ids.length
        ? await supabase.from('order_items').select('order_id, product_name, quantity, price').in('order_id', ids)
        : { data: [] as any[] };

      if (!alive) return;
      setBuy((deliveries || []).reduce((s: number, d: any) => s + Number(d.total_amount), 0));

      const map = new Map<string, DayPoint>();
      for (let i = 0; i < days; i++) {
        const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        const key = localDayKey(d);
        map.set(key, {
          key,
          label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
          sales: 0, cash: 0, transfer: 0, orders: 0,
        });
      }

      const itemsByOrder = new Map<string, { name: string; qty: number; price: number }[]>();
      const soldMap = new Map<string, Sold>();
      (items || []).forEach((row: any) => {
        const arr = itemsByOrder.get(row.order_id) || [];
        arr.push({ name: row.product_name, qty: Number(row.quantity), price: Number(row.price) });
        itemsByOrder.set(row.order_id, arr);
        const cur = soldMap.get(row.product_name) || { name: row.product_name, qty: 0, sum: 0 };
        cur.qty += Number(row.quantity);
        cur.sum += Number(row.quantity) * Number(row.price);
        soldMap.set(row.product_name, cur);
      });

      const byDay: Record<string, OrderRow[]> = {};
      list.forEach((o: any) => {
        const key = localDayKey(o.created_at);
        const row = map.get(key);
        if (row) {
          const t = Number(o.total);
          row.sales += t;
          row.orders += 1;
          if (o.payment_method === 'cash') row.cash += t;
          if (o.payment_method === 'transfer') row.transfer += t;
        }
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push({
          id: o.id,
          created_at: o.created_at,
          total: Number(o.total),
          payment_method: o.payment_method,
          table_number: o.table_number,
          items: itemsByOrder.get(o.id) || [],
        });
      });

      const pts = Array.from(map.values());
      const today = localDayKey(new Date());
      const richest = [...pts].sort((a, b) => b.sales - a.sales)[0]?.key;
      setPoints(pts);
      setTop(Array.from(soldMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 20));
      setOrdersByDay(byDay);
      setSelected((prev) => {
        if (prev && (byDay[prev]?.length || map.get(prev)?.sales)) return prev;
        if (byDay[today]?.length) return today;
        return richest || pts[pts.length - 1]?.key || null;
      });
      setUpdated(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    load();
    const t = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [days]);

  const sales = points.reduce((s, p) => s + p.sales, 0);
  const cash = points.reduce((s, p) => s + p.cash, 0);
  const transfer = points.reduce((s, p) => s + p.transfer, 0);
  const orderCount = points.reduce((s, p) => s + p.orders, 0);
  const max = Math.max(1, ...points.map((p) => p.sales));
  const best = [...points].sort((a, b) => b.sales - a.sales)[0];
  const dayOrders = selected ? ordersByDay[selected] || [] : [];
  const dayLabel = points.find((p) => p.key === selected)?.label || selected;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-semibold">Отчёты</h1>
          <p className="text-[#C8A77E] text-sm mt-1">Обновляется каждые 15 сек{updated ? ` · ${updated}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([1, 3, 7, 14, 30] as Range[]).map((n) => (
            <button key={n} type="button" onClick={() => setDays(n)} className={`px-4 py-3 rounded-3xl ${days === n ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#3F2A1F]'}`}>
              {n === 1 ? 'Сегодня' : `${n} дн.`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Продажи</p><p className="text-3xl font-mono">{sales} с</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Заказы</p><p className="text-3xl font-mono">{orderCount}</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Закуп</p><p className="text-3xl font-mono">{buy} с</p></div>
        <div className="card p-5"><p className="text-emerald-400 text-sm">Наличка</p><p className="text-3xl font-mono">{cash} с</p></div>
        <div className="card p-5"><p className="text-blue-400 text-sm">Перевод</p><p className="text-3xl font-mono">{transfer} с</p></div>
      </div>

      {best && best.sales > 0 && (
        <button type="button" onClick={() => setSelected(best.key)} className="card p-5 mb-6 w-full text-left">
          <p className="text-[#C8A77E] text-sm">Лучший день в периоде · нажми чтобы открыть историю</p>
          <p className="text-2xl font-semibold mt-1">{best.label} · {best.sales} с · {best.orders} заказов</p>
        </button>
      )}

      <div className="card p-6 mb-8">
        <p className="mb-4 text-[#C8A77E]">Выручка по дням · нажми столбик</p>
        <div className="flex items-end gap-1 h-56">
          {points.map((p) => (
            <button key={p.key} type="button" onClick={() => setSelected(p.key)} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className={`w-full rounded-t-lg ${p.key === selected ? 'bg-white' : p.key === best?.key ? 'bg-emerald-500' : 'bg-[#C8A77E]'}`}
                style={{ height: `${Math.round((p.sales / max) * 100)}%`, minHeight: p.sales ? 6 : 2 }}
              />
              <span className={`text-[10px] mt-1 ${p.key === selected ? 'text-white' : 'text-gray-400'}`}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card overflow-hidden">
          <h2 className="text-2xl p-6">Топ продаж</h2>
          {top.length === 0 ? <p className="px-6 pb-6 text-gray-400">Пока нет продаж за период</p> : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-t border-[#5C4030]">
                  <th className="p-4">Товар</th>
                  <th className="p-4">Кол-во</th>
                  <th className="p-4">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={r.name} className="border-t border-[#5C4030]">
                    <td className="p-4">{i + 1}. {r.name}</td>
                    <td className="p-4 font-mono">{r.qty}</td>
                    <td className="p-4 font-mono text-[#C8A77E]">{r.sum} с</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card overflow-hidden">
          <h2 className="text-2xl p-6">История {dayLabel}</h2>
          {dayOrders.length === 0 ? <p className="px-6 pb-6 text-gray-400">В этот день заказов нет</p> : (
            <div className="max-h-[520px] overflow-auto">
              {dayOrders.map((o) => (
                <div key={o.id} className="border-t border-[#5C4030] px-6 py-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">
                      {new Date(o.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {o.table_number ? ` · ${o.table_number}` : ''}
                      {o.payment_method === 'cash' ? ' · нал' : o.payment_method === 'transfer' ? ' · перевод' : ''}
                    </span>
                    <span className="font-mono text-[#C8A77E]">{o.total} с</span>
                  </div>
                  {o.items.length === 0 && <p className="text-sm text-gray-500">Состав чека не записан</p>}
                  {o.items.map((it, idx) => (
                    <p key={idx} className="text-sm">{it.qty}× {it.name}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
