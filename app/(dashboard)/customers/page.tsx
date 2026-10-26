'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toastStore';
import { friendlyError } from '@/lib/errors';
import { useSettings } from '@/lib/store/settingsStore';
import { LOYALTY_LEVELS, discountFor as discountFromSettings } from '@/lib/settings';

type Customer = { id?: string; name: string; phone: string; loyalty_level: string; points: number; total_spent: number };
const empty: Customer = { name: '', phone: '', loyalty_level: 'Bronze', points: 0, total_spent: 0 };

export default function CustomersPage() {
  const settings = useSettings();
  const discountFor = (level: string) => discountFromSettings(level, settings);
  const LEVELS = LOYALTY_LEVELS.map((id) => ({ id, label: id, discount: discountFor(id) }));
  const [rows, setRows] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Customer>(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('customers').select('*').order('name');
    setRows((data || []) as Customer[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (saving) return;
    if (!form.name.trim()) { setError('Имя обязательно'); return; }
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      loyalty_level: form.loyalty_level,
      points: Number(form.points) || 0,
      total_spent: Number(form.total_spent) || 0,
    };
    setSaving(true);
    setError('');
    const { error: err } = form.id
      ? await supabase.from('customers').update(payload).eq('id', form.id).select('id').single()
      : await supabase.from('customers').insert([payload]).select('id').single();
    setSaving(false);
    if (err) {
      const t = err.code === '23505' ? 'Клиент с таким телефоном уже есть. Найди его в списке.' : friendlyError(err);
      setError(t);
      toast.error(t);
      return;
    }
    toast.success(form.id ? `Клиент «${payload.name}» обновлён` : `Клиент «${payload.name}» сохранён`);
    setOpen(false);
    setForm(empty);
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-4xl font-semibold">Клиенты</h1>
          <p className="text-[#C8A77E]">Нажми строку, чтобы изменить. Скидка: {LEVELS.map((l) => `${l.label} ${l.discount}%`).join(' · ')}</p>
        </div>
        <button type="button" onClick={() => { setForm(empty); setError(''); setOpen(true); }} className="btn-primary px-8 py-4 flex items-center gap-2"><Plus /> Новый клиент</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="text-left border-b border-[#5C4030]"><th className="p-5">Имя</th><th className="p-5">Телефон</th><th className="p-5">Уровень</th><th className="p-5">Скидка</th><th className="p-5">Баллы</th><th className="p-5">Сумма</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#5C4030] hover:bg-[#5C4030]/40 cursor-pointer" onClick={() => { setForm({ ...c, phone: c.phone || '' }); setError(''); setOpen(true); }}>
                <td className="p-5">{c.name}</td>
                <td className="p-5">{c.phone}</td>
                <td className="p-5 text-[#C8A77E]">{c.loyalty_level}</td>
                <td className="p-5 font-mono">{discountFor(c.loyalty_level)}%</td>
                <td className="p-5">{c.points}</td>
                <td className="p-5 font-mono">{c.total_spent} с</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl">{form.id ? 'Изменить клиента' : 'Новый клиент'}</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Имя" aria-label="Имя" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" aria-label="Телефон" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <select value={form.loyalty_level} onChange={(e) => setForm({ ...form, loyalty_level: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4">
              {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label} — скидка {l.discount}%</option>)}
            </select>
            <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} placeholder="Баллы" aria-label="Баллы" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input type="number" value={form.total_spent} onChange={(e) => setForm({ ...form, total_spent: Number(e.target.value) })} placeholder="Потрачено" aria-label="Потрачено" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <p className="text-[#C8A77E] text-sm">На кассе скидка {discountFor(form.loyalty_level)}%</p>
            {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} disabled={saving} className="flex-1 py-3 rounded-3xl border border-[#5C4030] disabled:opacity-50">Отмена</button>
              <button type="button" onClick={save} disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение…</> : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
