'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Coffee, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useZone } from '@/lib/useZone';
import { lineInZone, zoneLabel } from '@/lib/zone';
import { bishkekDayStart, formatTime } from '@/lib/time';
import { useSettings } from '@/lib/store/settingsStore';
import { loadCashierZones } from '@/lib/cashierZones';

type Snapshot = {
  revenue: number; ordersCount: number; avg: number; cash: number; transfer: number; discounts: number;
  sold: { name: string; qty: number; sum: number }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- строки orders из select('*')
  recent: any[];
};
// Последние цифры по каждой зоне на время сессии вкладки: при возврате на дашборд
// они видны сразу, а свежие подгружаются в фоне.
const cache = new Map<string, Snapshot>();

export default function DashboardPage() {
  const { zone, isAdmin, profile } = useZone();
  const settings = useSettings();
  const zoneRef = useRef(zone);
  const { dessertsInCoffee, refreshSeconds } = settings.pos;
  const [snap, setSnap] = useState<Snapshot | null>(() => cache.get(zone) || null);
  const { revenue = 0, ordersCount = 0, avg = 0, cash = 0, transfer = 0, discounts = 0, sold = [], recent = [] } = snap || {};
  const loading = !snap;

  const load = async () => {
    const zoneAtStart = zone;
    // «Сегодня» считаем от 00:00 по Бишкеку, а не по часовому поясу устройства.
    const start = bishkekDayStart(0);
    const { data: orders } = await supabase
      .from('orders')
      // select('*'): колонка orders.zone появляется только после sql/18, до неё её просто нет.
      .select('*')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false });
    const list = orders || [];
    const ids = list.map((o) => o.id);
    const { data: items } = ids.length
      ? await supabase.from('order_items').select('order_id, product_id, product_name, quantity, price').in('order_id', ids)
      : { data: [] as any[] };
    const { data: products } = await supabase.from('products').select('id, name, section, category');
    const productById = new Map((products || []).map((p) => [p.id, p]));
    const orderById = new Map(list.map((o) => [o.id, o]));
    const ctx = { dessertsInCoffee, cashierZones: await loadCashierZones({ id: profile?.id, zone: profile?.zone }) };
    const inZone = (row: { order_id: string; product_id: string | null; product_name: string }) => lineInZone(productById.get(row.product_id) || { name: row.product_name }, zone, orderById.get(row.order_id), ctx);

    const map = new Map<string, { name: string; qty: number; sum: number }>();
    const orderShare = new Map<string, { zone: number; all: number }>();
    (items || []).forEach((row: any) => {
      const lineSum = Number(row.quantity) * Number(row.price);
      const visible = inZone(row);
      const share = orderShare.get(row.order_id) || { zone: 0, all: 0 };
      share.all += lineSum;
      if (visible) share.zone += lineSum;
      orderShare.set(row.order_id, share);
      if (!visible) return;
      const cur = map.get(row.product_name) || { name: row.product_name, qty: 0, sum: 0 };
      cur.qty += Number(row.quantity);
      cur.sum += lineSum;
      map.set(row.product_name, cur);
    });

    let rev = 0;
    let cashSum = 0;
    let transferSum = 0;
    let discountSum = 0;
    const recentZone: any[] = [];
    list.forEach((o) => {
      const share = orderShare.get(o.id);
      if (!share || share.zone <= 0) return;
      const part = share.all > 0 ? share.zone / share.all : 0;
      const amount = Math.round(Number(o.total) * part);
      rev += amount;
      if (o.payment_method === 'cash') cashSum += amount;
      if (o.payment_method === 'transfer') transferSum += amount;
      // Скидка по лояльности (orders.discount_amount, sql/20), в доле этой зоны.
      discountSum += Math.round(Number(o.discount_amount || 0) * part);
      recentZone.push({ ...o, zoneTotal: amount });
    });

    const next: Snapshot = {
      revenue: rev,
      ordersCount: recentZone.length,
      avg: recentZone.length ? Math.round(rev / recentZone.length) : 0,
      cash: cashSum,
      transfer: transferSum,
      discounts: discountSum,
      recent: recentZone.slice(0, 8),
      sold: Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 12),
    };
    cache.set(zoneAtStart, next);
    if (zoneRef.current === zoneAtStart) setSnap(next);
  };

  useEffect(() => {
    zoneRef.current = zone;
    setSnap(cache.get(zone) || null);
    load();
    const t = setInterval(load, refreshSeconds * 1000);
    return () => clearInterval(t);
  }, [zone, dessertsInCoffee, refreshSeconds, profile?.id]);

  // Без заглушки на весь экран: каркас виден сразу, цифры подставляются по готовности.
  const v = (n: number | string) => (loading ? '…' : n);

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-5xl font-semibold">{zoneLabel(zone)}</h1>
          <p className="text-[#C8A77E] text-lg sm:text-xl mt-1">
            {isAdmin ? 'Переключение зон — кнопки в меню слева' : 'Только эта зона'}
          </p>
        </div>
        <Link href="/pos" className="btn-primary px-5 py-3 text-lg flex items-center justify-center gap-2">
          {zone === 'kitchen' ? <Utensils /> : <Coffee />} Заказ
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Выручка</p><p className="text-3xl sm:text-4xl font-mono mt-2">{v(revenue)} с</p>{discounts > 0 && <p className="text-sm text-[#C8A77E] mt-1">скидки −{discounts} с</p>}</div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Заказы</p><p className="text-3xl sm:text-4xl font-mono mt-2">{v(ordersCount)}</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Средний чек</p><p className="text-3xl sm:text-4xl font-mono mt-2">{v(avg)} с</p></div>
        <div className="card p-5">
          <p className="text-[#C8A77E] text-sm mb-2">Оплата</p>
          <p className="text-emerald-400">Наличка {v(cash)} с</p>
          <p className="text-blue-400">Перевод {v(transfer)} с</p>
          <p className="text-[#C8A77E]">Скидки {v(discounts)} с</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <h2 className="text-xl sm:text-2xl p-5">Продали сегодня</h2>
          {sold.length === 0 ? <p className="p-5 text-gray-400">{loading ? 'Загрузка…' : 'Пока пусто'}</p> : (
            <table className="w-full"><thead><tr className="border-t border-[#5C4030] text-left"><th className="p-4">Товар</th><th className="p-4">Кол-во</th><th className="p-4">Сумма</th></tr></thead>
              <tbody>{sold.map((r) => <tr key={r.name} className="border-t border-[#5C4030]"><td className="p-4">{r.name}</td><td className="p-4 font-mono">{r.qty}</td><td className="p-4 font-mono text-[#C8A77E]">{r.sum} с</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div className="card overflow-hidden">
          <h2 className="text-xl sm:text-2xl p-5">Последние чеки</h2>
          {recent.length === 0 ? <p className="p-5 text-gray-400">{loading ? 'Загрузка…' : 'Нет заказов'}</p> : (
            <table className="w-full"><thead><tr className="border-t border-[#5C4030] text-left"><th className="p-4">Время</th><th className="p-4">Стол</th><th className="p-4">Сумма</th></tr></thead>
              <tbody>{recent.map((o) => (
                <tr key={o.id} className="border-t border-[#5C4030]">
                  <td className="p-4 text-gray-400">{formatTime(o.created_at)}</td>
                  <td className="p-4">{o.table_number || '—'}</td>
                  <td className="p-4 font-mono text-[#C8A77E]">{o.zoneTotal} с</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
