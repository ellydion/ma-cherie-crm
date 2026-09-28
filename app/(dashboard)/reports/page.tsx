\'use client\';

import { useEffect, useState } from \'react\';
import { supabase } from \'@/lib/supabase/client\';

type DayPoint = { key: string; label: string; sales: number; cash: number; transfer: number; orders: number };
type Range = 1 | 3 | 7 | 14 | 30;

export default function ReportsPage() {
  const [days, setDays] = useState<Range>(1);
  const [points, setPoints] = useState<DayPoint[]>([]);
  const [buy, setBuy] = useState(0);
  const [updated, setUpdated] = useState(\'\');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      from.setDate(from.getDate() - (days - 1));
      const { data: orders } = await supabase
        .from(\'orders\')
        .select(\'total, payment_method, created_at\')
        .gte(\'created_at\', from.toISOString())
        .order(\'created_at\', { ascending: true });
      const { data: deliveries } = await supabase
        .from(\'deliveries\')
        .select(\'total_amount, delivery_date\')
        .gte(\'delivery_date\', from.toISOString().slice(0, 10));
      if (!alive) return;
      setBuy((deliveries || []).reduce((s: number, d: any) => s + Number(d.total_amount), 0));

      const map = new Map<string, DayPoint>();
      for (let i = 0; i < days; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        map.set(key, {
          key,
          label: `${String(d.getDate()).padStart(2, \'0\')}.${String(d.getMonth() + 1).padStart(2, \'0\')}`,
          sales: 0, cash: 0, transfer: 0, orders: 0,
        });
      }
      (orders || []).forEach((o: any) => {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        const row = map.get(key);
        if (!row) return;
        const t = Number(o.total);
        row.sales += t;
        row.orders += 1;
        if (o.payment_method === \'cash\') row.cash += t;
        if (o.payment_method === \'transfer\') row.transfer += t;
      });
      setPoints(Array.from(map.values()));
      setUpdated(new Date().toLocaleTimeString(\'ru-RU\', { hour: \'2-digit\', minute: \'2-digit\', second: \'2-digit\' }));
    };
    load();
    const t = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener(\'focus\', onFocus);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener(\'focus\', onFocus);
    };
  }, [days]);

  const sales = points.reduce((s, p) => s + p.sales, 0);
  const cash = points.reduce((s, p) => s + p.cash, 0);
  const transfer = points.reduce((s, p) => s + p.transfer, 0);
  const orders = points.reduce((s, p) => s + p.orders, 0);
  const max = Math.max(1, ...points.map((p) => p.sales));
  const best = [...points].sort((a, b) => b.sales - a.sales)[0];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-semibold">Отчёты</h1>
          <p className="text-[#C8A77E] text-sm mt-1">Обновляется каждые 15 сек{updated ? ` · ${updated}` : \'\'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([1, 3, 7, 14, 30] as Range[]).map((n) => (
            <button key={n} type="button" onClick={() => setDays(n)} className={`px-4 py-3 rounded-3xl ${days === n ? \'bg-[#C8A77E] text-[#3F2A1F]\' : \'bg-[#3F2A1F]\'}`}>
              {n === 1 ? \'Сегодня\' : `${n} дн.`}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Продажи</p><p className="text-3xl font-mono">{sales} с</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Заказы</p><p className="text-3xl font-mono">{orders}</p></div>
        <div className="card p-5"><p className="text-[#C8A77E] text-sm">Закуп</p><p className="text-3xl font-mono">{buy} с</p></div>
        <div className="card p-5"><p className="text-emerald-400 text-sm">Наличка</p><p className="text-3xl font-mono">{cash} с</p></div>
        <div className="card p-5"><p className="text-blue-400 text-sm">Перевод</p><p className="text-3xl font-mono">{transfer} с</p></div>
      </div>
      {best && best.sales > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-[#C8A77E] text-sm">Лучший день в периоде</p>
          <p className="text-2xl font-semibold mt-1">{best.label} · {best.sales} с · {best.orders} заказов</p>
        </div>
      )}
      <div className="card p-6">
        <p className="mb-4 text-[#C8A77E]">Выручка по дням</p>
        <div className="flex items-end gap-1 h-56">
          {points.map((p) => (
            <div key={p.key} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className={`w-full rounded-t-lg ${p.key === best?.key ? \'bg-emerald-500\' : \'bg-[#C8A77E]\'}`}
                style={{ height: `${Math.round((p.sales / max) * 100)}%`, minHeight: p.sales ? 6 : 2 }}
                title={`${p.label}: ${p.sales} с`}
              />
              <span className="text-[10px] text-gray-400 mt-1">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
