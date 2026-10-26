'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/lib/store/toastStore';
import { friendlyError } from '@/lib/errors';

type Supplier = { id?: string; name: string; contact: string; phone: string };
const empty: Supplier = { name: '', contact: '', phone: '' };

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Supplier>(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setRows((data || []) as Supplier[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (saving) return;
    if (!form.name.trim()) { setError('Название обязательно'); return; }
    const payload = { name: form.name.trim(), contact: form.contact, phone: form.phone };
    setSaving(true);
    setError('');
    const { error: err } = form.id
      ? await supabase.from('suppliers').update(payload).eq('id', form.id).select('id').single()
      : await supabase.from('suppliers').insert([payload]).select('id').single();
    setSaving(false);
    if (err) {
      const t = friendlyError(err);
      setError(t);
      toast.error(t);
      return;
    }
    toast.success(form.id ? `Поставщик «${payload.name}» обновлён` : `Поставщик «${payload.name}» сохранён`);
    setOpen(false);
    setForm(empty);
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-4xl font-semibold">Поставщики</h1>
          <p className="text-[#C8A77E]">Добавление и правка карточки</p>
        </div>
        <button type="button" onClick={() => { setForm(empty); setError(''); setOpen(true); }} className="btn-primary px-8 py-4 flex items-center gap-2"><Plus /> Новый поставщик</button>
      </div>
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="card p-5 flex justify-between items-center">
            <div>
              <p className="text-xl font-semibold">{s.name}</p>
              <p className="text-gray-400">{s.contact} · {s.phone}</p>
            </div>
            <button type="button" onClick={() => { setForm(s); setError(''); setOpen(true); }}><Pencil className="w-5 h-5 text-[#C8A77E]" /></button>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-2xl">{form.id ? 'Изменить поставщика' : 'Новый поставщик'}</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Компания" aria-label="Компания" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Контакт" aria-label="Контакт" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" aria-label="Телефон" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
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
