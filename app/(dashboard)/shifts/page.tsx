'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useShiftStore } from '@/lib/store/shiftStore';
import { downloadXlsx } from '@/lib/excel';

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

type Check = { id: string; done: boolean; task: { title: string; phase: string; sort: number } };

export default function ShiftsPage() {
  const { current, refresh, openShift, closeShift } = useShiftStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [checks, setChecks] = useState<Check[]>([]);

  const seedChecks = async (shiftId: string) => {
    const { data: tasks } = await supabase.from('checklist_tasks').select('id').order('sort');
    if (!tasks?.length) return;
    const { data: existing } = await supabase.from('shift_checks').select('id').eq('shift_id', shiftId);
    if (existing?.length) return;
    await supabase.from('shift_checks').insert(tasks.map((t) => ({ shift_id: shiftId, task_id: t.id, done: false })));
  };

  const loadChecks = async (shiftId?: string) => {
    if (!shiftId) { setChecks([]); return; }
    const { data } = await supabase
      .from('shift_checks')
      .select('id, done, task:checklist_tasks(title, phase, sort)')
      .eq('shift_id', shiftId);
    const list = (data || []).map((c: any) => ({
      id: c.id,
      done: c.done,
      task: Array.isArray(c.task) ? c.task[0] : c.task,
    })).filter((c: Check) => c.task);
    list.sort((a, b) => (a.task.sort || 0) - (b.task.sort || 0));
    setChecks(list);
  };

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
      withStats.push({ id: s.id, started_at: s.started_at, ended_at: s.ended_at, note: s.note, sales, orders: (orders || []).length, cash, transfer });
    }
    setRows(withStats);
    const open = list.find((s) => !s.ended_at);
    if (open) {
      await seedChecks(open.id);
      await loadChecks(open.id);
    } else setChecks([]);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  const onOpen = async () => {
    if (current) { setMsg('Смена уже открыта'); return; }
    const id = await openShift();
    if (id) await seedChecks(id);
    setMsg(id ? 'Смена открыта, чек-лист обновлён' : 'Не удалось открыть смену. Выполни SQL.');
    load();
  };

  const onClose = async () => {
    await closeShift();
    setMsg('Смена закрыта');
    load();
  };

  const toggle = async (c: Check) => {
    await supabase.from('shift_checks').update({ done: !c.done, done_at: !c.done ? new Date().toISOString() : null }).eq('id', c.id);
    loadChecks(current?.id);
  };

  const best = rows.filter((r) => r.ended_at).sort((a, b) => b.sales - a.sales)[0];
  const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const phases = [
    { id: 'open', label: 'Открытие' },
    { id: 'day', label: 'В течение дня' },
    { id: 'close', label: 'Закрытие' },
  ];

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-semibold">Смены</h1>
          <p className="text-[#C8A77E] mt-1">{current ? `Открыта с ${fmt(current.started_at)}` : 'Сейчас смена закрыта'}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => downloadXlsx('smeny.xlsx', rows.map((r) => ({
            'начало': fmt(r.started_at), 'конец': r.ended_at ? fmt(r.ended_at) : 'идёт', 'заказы': r.orders, 'выручка': r.sales, 'нал': r.cash, 'перевод': r.transfer,
          })))} className="px-6 py-4 rounded-3xl border border-[#5C4030]">Excel</button>
          {!current ? (
            <button type="button" onClick={onOpen} className="btn-primary px-8 py-4">Открыть смену</button>
          ) : (
            <button type="button" onClick={onClose} className="px-8 py-4 rounded-3xl bg-red-700">Закрыть смену</button>
          )}
        </div>
      </div>
      {msg && <p className="text-amber-400 mb-4">{msg}</p>}

      {current && (
        <div className="card p-6 mb-8">
          <h2 className="text-2xl mb-1">Чек-лист баристы</h2>
          <p className="text-[#C8A77E] text-sm mb-4">Новый список на каждую открытую смену</p>
          {checks.length === 0 && <p className="text-gray-400">Нет задач — запусти SQL чек-листа</p>}
          {phases.map((ph) => {
            const items = checks.filter((c) => c.task.phase === ph.id);
            if (!items.length) return null;
            return (
              <div key={ph.id} className="mb-5">
                <p className="text-sm text-[#C8A77E] mb-2">{ph.label}</p>
                <div className="space-y-2">
                  {items.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 bg-[#2C241E] rounded-2xl px-4 py-3">
                      <input type="checkbox" checked={c.done} onChange={() => toggle(c)} className="w-5 h-5" />
                      <span className={c.done ? 'line-through text-gray-500' : ''}>{c.task.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <th className="p-4">Начало</th><th className="p-4">Конец</th><th className="p-4">Заказы</th><th className="p-4">Выручка</th><th className="p-4">Нал / перевод</th>
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
