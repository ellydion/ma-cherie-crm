'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useShiftStore } from '@/lib/store/shiftStore';
import { downloadXlsx } from '@/lib/excel';
import { formatDateTime } from '@/lib/time';
import { useSettings } from '@/lib/store/settingsStore';
import { friendlyError } from '@/lib/errors';

type Row = {
  id: string;
  started_at: string;
  ended_at: string | null;
  note: string | null;
  sales: number;
  orders: number;
  cash: number;
  transfer: number;
  /** false, пока выручка по смене ещё считается. */
  statsReady: boolean;
};

type ShiftRow = { id: string; started_at: string; ended_at: string | null; note: string | null };
type OrderLite = { total: number | string; payment_method: string | null; created_at: string; shift_id: string | null };

const PAGE = 1000;

/** Заказы за [from, to) постранично по 1000 (обычно одна страница). */
async function fetchOrders(from: string, to?: string) {
  const out: OrderLite[] = [];
  for (let page = 0; page < 50; page++) {
    let q = supabase
      .from('orders')
      .select('total, payment_method, created_at, shift_id')
      .gte('created_at', from);
    if (to) q = q.lt('created_at', to);
    const { data, error } = await q
      .order('created_at', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) return { data: out, error };
    out.push(...((data || []) as OrderLite[]));
    if (!data || data.length < PAGE) break;
  }
  return { data: out, error: null };
}

/** Окно заказов, которое запрашивается сразу, параллельно со списком смен. */
const ORDERS_WINDOW_DAYS = 60;

/** Выручка по сменам: по orders.shift_id, а для заказов без смены по времени, как раньше. */
function statsByShift(shifts: ShiftRow[], orders: OrderLite[]) {
  const stats = new Map<string, { sales: number; orders: number; cash: number; transfer: number }>();
  shifts.forEach((s) => stats.set(s.id, { sales: 0, orders: 0, cash: 0, transfer: 0 }));
  const ranges = shifts.map((s) => ({ id: s.id, from: Date.parse(s.started_at), to: s.ended_at ? Date.parse(s.ended_at) : Infinity }));
  for (const o of orders) {
    let target = o.shift_id && stats.has(o.shift_id) ? o.shift_id : null;
    if (!target && !o.shift_id) {
      const t = Date.parse(o.created_at);
      target = ranges.find((r) => t >= r.from && t <= r.to)?.id || null;
    }
    if (!target) continue;
    const st = stats.get(target)!;
    const total = Number(o.total) || 0;
    st.sales += total;
    st.orders += 1;
    if (o.payment_method === 'cash') st.cash += total;
    if (o.payment_method === 'transfer') st.transfer += total;
  }
  return stats;
}

type Check = { id: string; done: boolean; task: { title: string; phase: string; sort: number } };

export default function ShiftsPage() {
  const { current, refresh, openShift, closeShift } = useShiftStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState('');
  const [checks, setChecks] = useState<Check[]>([]);
  const refreshSeconds = useSettings().pos.refreshSeconds;

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  // Номер последней загрузки: ответы старых загрузок отбрасываются.
  const seqRef = useRef(0);
  // Пока идёт загрузка, тики автообновления пропускаются, чтобы запросы не копились.
  const busyRef = useRef(false);

  const seedChecks = async (shiftId: string) => {
    const { data: existing } = await supabase.from('shift_checks').select('id').eq('shift_id', shiftId).limit(1);
    if (existing?.length) return;
    const { data: tasks } = await supabase.from('checklist_tasks').select('id').order('sort');
    if (!tasks?.length) return;
    await supabase.from('shift_checks').insert(tasks.map((t) => ({ shift_id: shiftId, task_id: t.id, done: false })));
  };

  const loadChecks = async (shiftId?: string, seq?: number) => {
    if (!shiftId) { setChecks([]); return; }
    const { data } = await supabase
      .from('shift_checks')
      .select('id, done, task:checklist_tasks(title, phase, sort)')
      .eq('shift_id', shiftId);
    if (seq !== undefined && seq !== seqRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- вложенный select без сгенерированных типов
    const list = (data || []).map((c: any) => ({
      id: c.id,
      done: c.done,
      task: Array.isArray(c.task) ? c.task[0] : c.task,
    })).filter((c: Check) => c.task);
    list.sort((a, b) => (a.task.sort || 0) - (b.task.sort || 0));
    setChecks(list);
  };

  // Причина «…» в колонках: выручка ждала цепочку refresh -> смены -> заказы + чек-лист (Promise.all),
  // а эффект с [refreshSeconds] перезапускался, когда настройки приходили с сервера (20 -> 30 с),
  // и отменял (seq++) уже идущую загрузку. Итог: цифры появлялись через 2+ с или терялись.
  // Теперь заказы запрашиваются параллельно со сменами, чек-лист грузится отдельно, а смена
  // интервала автообновления не отменяет загрузку.
  const load = async (force = false) => {
    if (busyRef.current && !force) return;
    busyRef.current = true;
    const seq = ++seqRef.current;
    const cutoff = new Date(Date.now() - ORDERS_WINDOW_DAYS * 86400e3).toISOString();
    const recentTask = fetchOrders(cutoff);
    try {
      const [, shiftsRes] = await Promise.all([
        refresh(),
        supabase.from('shifts').select('id, started_at, ended_at, note').order('started_at', { ascending: false }).limit(40),
      ]);
      if (seq !== seqRef.current) return;
      if (shiftsRes.error) {
        setLoadError(friendlyError(shiftsRes.error, 'Не удалось загрузить смены'));
        setLoaded(true);
        return;
      }
      setLoadError('');
      const list = (shiftsRes.data || []) as ShiftRow[];
      setRows((prev) => {
        const old = new Map(prev.map((r) => [r.id, r]));
        return list.map((s) => {
          const was = old.get(s.id);
          return was
            ? { ...was, ...s }
            : { ...s, sales: 0, orders: 0, cash: 0, transfer: 0, statsReady: false };
        });
      });
      setLoaded(true);

      // Чек-лист отдельно: его ошибки и задержки больше не держат выручку.
      const open = list.find((s) => !s.ended_at);
      if (open) {
        seedChecks(open.id).then(() => loadChecks(open.id, seq)).catch((e) => console.error(e));
      } else {
        setChecks([]);
      }

      const oldest = list[list.length - 1]?.started_at;
      const olderTask = oldest && oldest < cutoff
        ? fetchOrders(oldest, cutoff)
        : Promise.resolve({ data: [] as OrderLite[], error: null });
      const [recent, older] = await Promise.all([recentTask, olderTask]);
      const ordersError = recent.error || older.error;
      // Свежий ответ по тем же сменам применяем, даже если успела начаться новая загрузка.
      if (ordersError) {
        if (seq === seqRef.current) setLoadError(friendlyError(ordersError, 'Не удалось посчитать выручку смен'));
        return;
      }
      const stats = statsByShift(list, [...older.data, ...recent.data]);
      setRows((prev) => prev.map((r) => {
        const st = stats.get(r.id);
        return st ? { ...r, ...st, statsReady: true } : r;
      }));
    } catch (e) {
      console.error(e);
      if (seq === seqRef.current) setLoadError('Не удалось загрузить смены. Обнови страницу.');
    } finally {
      if (seq === seqRef.current) busyRef.current = false;
    }
  };

  useEffect(() => {
    load(true);
    // seqRef не DOM-узел: инкремент в cleanup отменяет незавершённую загрузку при уходе со страницы.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { seqRef.current++; busyRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- первая загрузка один раз

  useEffect(() => {
    // Смена интервала (настройки пришли с сервера) только переставляет таймер, загрузку не отменяет.
    const t = setInterval(() => load(), Math.max(5, refreshSeconds || 30) * 1000);
    return () => clearInterval(t);
  }, [refreshSeconds]); // eslint-disable-line react-hooks/exhaustive-deps -- load читает актуальное состояние через ref'ы

  const onOpen = async () => {
    if (current) { setMsg('Смена уже открыта'); return; }
    const id = await openShift();
    if (id) await seedChecks(id);
    setMsg(id ? 'Смена открыта, чек-лист обновлён' : 'Не удалось открыть смену. Попробуй ещё раз или сообщи администратору.');
    load(true);
  };

  const onClose = async () => {
    await closeShift();
    setMsg('Смена закрыта');
    load(true);
  };

  const toggle = async (c: Check) => {
    await supabase.from('shift_checks').update({ done: !c.done, done_at: !c.done ? new Date().toISOString() : null }).eq('id', c.id);
    loadChecks(current?.id);
  };

  const best = rows.filter((r) => r.ended_at && r.statsReady).sort((a, b) => b.sales - a.sales)[0];
  const fmt = (iso: string) => formatDateTime(iso);
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
      {loadError && <p className="text-red-400 mb-4 text-sm">{loadError}</p>}

      {current && (
        <div className="card p-6 mb-8">
          <h2 className="text-2xl mb-1">Чек-лист баристы</h2>
          <p className="text-[#C8A77E] text-sm mb-4">Новый список на каждую открытую смену</p>
          {checks.length === 0 && <p className="text-gray-400">Задач на смену пока нет</p>}
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
            {!loaded && <tr><td colSpan={5} className="p-4 text-gray-400">Загрузка смен...</td></tr>}
            {loaded && rows.length === 0 && !loadError && <tr><td colSpan={5} className="p-4 text-gray-400">Смен пока нет</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#5C4030]">
                <td className="p-4">{fmt(r.started_at)}</td>
                <td className="p-4">{r.ended_at ? fmt(r.ended_at) : <span className="text-emerald-400">идёт</span>}</td>
                <td className="p-4 font-mono">{r.statsReady ? r.orders : '…'}</td>
                <td className="p-4 font-mono text-[#C8A77E]">{r.statsReady ? `${r.sales} с` : '…'}</td>
                <td className="p-4 text-sm">{r.statsReady ? `${r.cash} / ${r.transfer}` : '…'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
