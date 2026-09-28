'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useShiftStore } from '@/lib/store/shiftStore';

type Row = {
  id: string;
  started_at: string;
  ended_at: string | null;
  note: string | null;
  sales: number;
  orders: number;
  cash: number;
  transfer: number;
};

export default function ShiftsPage() {
  const { current, refresh, openShift, closeShift } = useShiftStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    await refresh();
    const { data: shifts } = await supabase.from('shifts').select('*').order('started_at', { ascending: false }).limit(40);
    const list = shifts || [];
    const withStats: Row[] = [];
    for (const s of list) {
      let q = supabase.from('orders').select('total, payment_method').gte('created_at', s.started_at);
      if (s.ended_at) q = q.lte('created_at', s.ended_at);
      const { data: orders } = await q;
      const sales = (orders || []).reduce((n, o) => n + Number(o.total), 0);
      const cash = (orders || []).filter((o) => o.payment_method === 'cash').reduce((n, o) => n + Number(o.total), 0);
      const transfer = (orders || []).filter((o) => o.payment_method === 'transfer').reduce((n, o) => n + Number(o.total), 0);
      withStats.push({
        id: s.id,
        started_at: s.started_at,
        ended_at: s.ended_at,
        note: s.note,
        sales,
        orders: (orders || []).length,
        cash,
        transfer,
      });
    }
    setRows(withStats);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const onOpen = async () => {
    if (current) { setMsg('Смена уже открыта'); return; }
    const id = await openShift();
    setMsg(id ? 'Смена открыта' : 'Не удалось открыть смену. Выполни SQL для таблицы shifts.');
    load();
  };

  const onClose = async () => {
    await closeShift();
    setMsg('Смена закрыта');
    load();
  };

  const best = rows.filter((r) => r.ended_at).sort((a, b) => b.sales - a.sales)[0];
  const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-semibold">Смены</h1>
          <p className="text-[#C8A77E] mt-1">
            {current ? `Открыта с ${fmt(current.started_at)}` : 'Сейчас смена закрыта'}
          </p>
        </div>
        <div className="flex gap-3">
          {!current ? (
            <button type="button" onClick={onOpen} className="btn-primary px-8 py-4">Открыть смену</button>
          ) : (
            <button type="button" onClick={onClose} className="px-8 py-4 rounded-3xl bg-red-700">Закрыть смену</button>
          )}
        </div>
      </div>
      {msg && <p className="text-amber-400 mb-4">{msg}</p>}
      {best && (
        <div className="card p-6 mb-6">
          <p className="text-[#C8A77E] text-sm">Лучшая закрытая смена</p>
          <p className="text-3xl font-mono mt-1">{best.sales} с · {best.orders} заказов</p>
          <p className="text-gray-400 mt-1">{fmt(best.started_at)}</p>
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-[#5C4030]">
              <th className="p-4">Начало</th>
              <th className="p-4">Конец</th>
              <th className="p-4">Заказы</th>
              <th className="p-4">Выручка</th>
              <th className="p-4">Нал / перевод</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#5C4030]">
                <td className="p-4">{fmt(r.started_at)}</td>
                <td className="p-4">{r.ended_at ? fmt(r.ended_at) : <span className="text-emerald-400">идёт</span>}</td>
                <td className="p-4 font-mono">{r.orders}</td>
                <td className="p-4 font-mono text-[#C8A77E]">{r.sales} с</td>
                <td className="p-4 text-sm">{r.cash} / {r.transfer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
