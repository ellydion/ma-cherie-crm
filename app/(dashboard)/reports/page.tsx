'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/excel';

type DayPoint = { key: string; label: string; sales: number; cash: number; transfer: number; orders: number; cost: number; net: number };
type Range = 1 | 3 | 7 | 14 | 30;
type Sold = { name: string; qty: number; sum: number };
type Line = { name: string; qty: number; price: number; cost: number };
type OrderRow = {
  id: string;
  created_at: string;
  total: number;
  cost: number;
  net: number;
  payment_method: string | null;
  table_number: string | null;
  items: Line[];
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

      const [{ data: orders }, { data: deliveries }, { data: products }, { data: recipes }, { data: ings }] = await Promise.all([
        supabase.from('orders').select('id, total, payment_method, created_at, table_number').gte('created_at', from.toISOString()).order('created_at', { ascending: false }),
        supabase.from('deliveries').select('total_amount, delivery_date').gte('delivery_date', from.toISOString().slice(0, 10)),
        supabase.from('products').select('id, name, cost_price'),
        supabase.from('product_ingredients').select('product_id, ingredient_id, quantity'),
        supabase.from('ingredients').select('id, cost_price'),
      ]);

      const list = orders || [];
      const ids = list.map((o) => o.id);
      const { data: items } = ids.length
        ? await supabase.from('order_items').select('order_id, product_id, product_name, quantity, price').in('order_id', ids)
        : { data: [] as any[] };

      if (!alive) return;

      const costByIng = new Map((ings || []).map((i: any) => [i.id, Number(i.cost_price || 0)]));
      const costByProduct = new Map((products || []).map((p: any) => [p.id, Number(p.cost_price || 0)]));
      const recipeCost = new Map<string, number>();
      (recipes || []).forEach((r: any) => {
        const add = Number(r.quantity) * (costByIng.get(r.ingredient_id) || 0);
        recipeCost.set(r.product_id, (recipeCost.get(r.product_id) || 0) + add);
      });
      const unitCost = (productId: string | null) => {
        if (!productId) return 0;
        if (recipeCost.has(productId)) return recipeCost.get(productId) || 0;
        return costByProduct.get(productId) || 0;
      };

      setBuy((deliveries || []).reduce((s: number, d: any) => s + Number(d.total_amount), 0));

      const map = new Map<string, DayPoint>();
      for (let i = 0; i < days; i++) {
        const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
        const key = localDayKey(d);
        map.set(key, { key, label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`, sales: 0, cash: 0, transfer: 0, orders: 0, cost: 0, net: 0 });
      }

      const itemsByOrder = new Map<string, Line[]>();
      const soldMap = new Map<string, Sold>();
      const costByOrder = new Map<string, number>();
      (items || []).forEach((row: any) => {
        const qty = Number(row.quantity);
        const cost = unitCost(row.product_id) * qty;
        const arr = itemsByOrder.get(row.order_id) || [];
        arr.push({ name: row.product_name, qty, price: Number(row.price), cost: Math.round(cost) });
        itemsByOrder.set(row.order_id, arr);
        costByOrder.set(row.order_id, (costByOrder.get(row.order_id) || 0) + cost);
        const cur = soldMap.get(row.product_name) || { name: row.product_name, qty: 0, sum: 0 };
        cur.qty += qty;
        cur.sum += qty * Number(row.price);
        soldMap.set(row.product_name, cur);
      });

      const byDay: Record<string, OrderRow[]> = {};
      list.forEach((o: any) => {
        const key = localDayKey(o.created_at);
        const total = Number(o.total);
        const cost = Math.round(costByOrder.get(o.id) || 0);
        const net = total - cost;
        const row = map.get(key);
        if (row) {
          row.sales += total;
          row.cost += cost;
          row.net += net;
          row.orders += 1;
          if (o.payment_method === 'cash') row.cash += total;
          if (o.payment_method === 'transfer') row.transfer += total;
        }
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push({
          id: o.id,
          created_at: o.created_at,
          total,
          cost,
          net,
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
    window.addEventListener('focus', load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener('focus', load);
    };
  }, [days]);

  const sales = points.reduce((s, p) => s + p.sales, 0);
  const cash = points.reduce((s, p) => s + p.cash, 0);
  const transfer = points.reduce((s, p) => s + p.transfer, 0);
  const costSum = points.reduce((s, p) => s + p.cost, 0);
  const netSum = points.reduce((s, p) => s + p.net, 0);
  const orderCount = points.reduce((s, p) => s + p.orders, 0);
  const max = Math.max(1, ...points.map((p) => p.sales));
  const best = [...points].sort((a, b) => b.sales - a.sales)[0];
  const dayOrders = selected ? ordersByDay[selected] || [] : [];
  const dayLabel = points.find((p) => p.key === selected)?.label || selected;
  const dayGross = dayOrders.reduce((s, o) => s + o.total, 0);
  const dayCost = dayOrders.reduce((s, o) => s + o.cost, 0);
  const dayNet = dayGross - dayCost;

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
          <button type="button" onClick={() => downloadXlsx(`otchet-period-${days}d.xlsx`, points.map((p) => ({
            'дата': p.label,
            'заказы': p.orders,
            'сумма': p.sales,
            'себестоимость': p.cost,
            'чистыми': p.net,
            'нал': p.cash,
            'перевод': p.transfer,
          })))} className="px-4 py-3 rounded-3xl border border-[#5C4030]">Excel периода</button>
          <button type="button" onClick={() => downloadXlsx(`otchet-${days}d.xlsx`, dayOrders.map((o) => ({
            'время': new Date(o.created_at).toLocaleString('ru-RU'),
            'стол': o.table_number || '',
            'оплата': o.payment_method || '',
            'сумма': o.total,
            'себестоимость': o.cost,
            'чистыми': o.net,
            'состав': o.items.map((i) => `${i.qty}x ${i.name} (${i.cost}с)`).join('; '),
          })))} className="px-4 py-3 rounded-3xl border border-[#5C4030]">Excel дня</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Продажи</p><p className="text-3xl font-mono">{sales} с</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Себес (техкарты)</p><p className="text-3xl font-mono">{costSum} с</p></div>
        <div className="card p-5"><p className="text-emerald-400 text-sm">Чистыми</p><p className="text-3xl font-mono">{netSum} с</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Заказы</p><p className="text-3xl font-mono">{orderCount}</p></div>
        <div className="card p-5"><p className="text-emerald-400 text-sm">Наличка</p><p className="text-3xl font-mono">{cash} с</p></div>
        <div className="card p-5"><p className="text-blue-400 text-sm">Перевод</p><p className="text-3xl font-mono">{transfer} с</p></div>
      </div>
      <p className="text-gray-400 text-sm -mt-6 mb-8">Закуп за период: {buy} с</p>

      {best && best.sales > 0 && (
        <button type="button" onClick={() => setSelected(best.key)} className="card p-5 mb-6 w-full text-left">
          <p className="text-[#C8A77E] text-sm">Лучший день · нажми</p>
          <p className="text-2xl font-semibold mt-1">{best.label} · {best.sales} с · чистыми {best.net} с</p>
        </button>
      )}

      <div className="card p-6 mb-8">
        <p className="mb-4 text-[#C8A77E]">Выручка по дням · нажми столбик</p>
        <div className="flex items-end gap-1 h-56">
          {points.map((p) => (
            <button key={p.key} type="button" onClick={() => setSelected(p.key)} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className={`w-full rounded-t-lg ${p.key === selected ? 'bg-white' : p.key === best?.key ? 'bg-emerald-500' : 'bg-[#C8A77E]'}`} style={{ height: `${Math.round((p.sales / max) * 100)}%`, minHeight: p.sales ? 6 : 2 }} />
              <span className={`text-[10px] mt-1 ${p.key === selected ? 'text-white' : 'text-gray-400'}`}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card overflow-hidden">
          <h2 className="text-2xl p-6">Топ продаж</h2>
          {top.length === 0 ? <p className="px-6 pb-6 text-gray-400">Пока нет продаж</p> : (
            <table className="w-full">
              <thead><tr className="text-left border-t border-[#5C4030]"><th className="p-4">Товар</th><th className="p-4">Кол-во</th><th className="p-4">Сумма</th></tr></thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={r.name} className="border-t border-[#5C4030]"><td className="p-4">{i + 1}. {r.name}</td><td className="p-4 font-mono">{r.qty}</td><td className="p-4 font-mono text-[#C8A77E]">{r.sum} с</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl">История {dayLabel}</h2>
            <p className="text-sm text-[#C8A77E] mt-2">Сумма {dayGross} с · техкарты {dayCost} с · чистыми {dayNet} с</p>
          </div>
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
                    <span className="font-mono">сумма {o.total} с</span>
                  </div>
                  <p className="text-sm text-emerald-400 mb-2">чистыми {o.net} с · техкарты −{o.cost} с</p>
                  {o.items.length === 0 && <p className="text-sm text-gray-500">Состав чека не записан</p>}
                  {o.items.map((it, idx) => (
                    <p key={idx} className="text-sm flex justify-between gap-3">
                      <span>{it.qty}× {it.name}</span>
                      <span className="font-mono text-gray-400">{it.qty * it.price} / себес {it.cost}</span>
                    </p>
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
