'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useZone } from '@/lib/useZone';
import { zoneLabel } from '@/lib/zone';
import { toast } from '@/lib/store/toastStore';
import { friendlyError } from '@/lib/errors';

type Ing = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_threshold: number;
  section: 'coffee' | 'kitchen' | string;
  cost_price?: number;
};

type FormState = {
  name: string;
  unit: string;
  quantity: number;
  min_threshold: number;
  section: 'coffee' | 'kitchen';
  cost_price: number;
};

const emptyForm: FormState = { name: '', unit: 'кг', quantity: 0, min_threshold: 5, section: 'coffee', cost_price: 0 };

export default function IngredientsPage() {
  const { zone } = useZone();
  const [items, setItems] = useState<Ing[]>([]);
  const [tab, setTab] = useState<'all' | 'coffee' | 'kitchen'>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ing | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [usage, setUsage] = useState<number | null>(null);

  const load = async () => {
    const { data, error: loadError } = await supabase.from('ingredients').select('*').order('name');
    if (loadError) { setError(loadError.message); return; }
    setItems((data || []) as Ing[]);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (zone !== 'all') setTab(zone); }, [zone]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (zone !== 'all' && i.section !== zone) return false;
      if (tab !== 'all' && i.section !== tab) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, tab, search, zone]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, section: zone === 'kitchen' ? 'kitchen' : 'coffee' });
    setError('');
    setOpen(true);
  };

  const openEdit = (item: Ing) => {
    setEditing(item);
    setForm({
      name: item.name,
      unit: item.unit || 'кг',
      quantity: Number(item.quantity) || 0,
      min_threshold: Number(item.min_threshold) || 0,
      section: item.section === 'kitchen' ? 'kitchen' : 'coffee',
      cost_price: Number(item.cost_price) || 0,
    });
    setError('');
    setOpen(true);
  };

  const startRename = (item: Ing) => { setRenameId(item.id); setRenameValue(item.name); setError(''); };

  const saveRename = async (item: Ing) => {
    const name = renameValue.trim();
    if (!name) { setError('Название не может быть пустым'); return; }
    if (name === item.name) { setRenameId(null); return; }
    const same = items.find((i) => i.id !== item.id && i.name.trim().toLowerCase() === name.toLowerCase());
    if (same) { setError('«' + same.name + '» уже есть.'); return; }
    setRenaming(true);
    const { error: saveError } = await supabase.from('ingredients').update({ name, updated_at: new Date().toISOString() }).eq('id', item.id).select('id').single();
    setRenaming(false);
    if (saveError) { const t = friendlyError(saveError); setError(t); toast.error(t); return; }
    setRenameId(null);
    toast.success(`Переименовано в «${name}»`);
    await load();
  };

  const save = async () => {
    if (saving) return;
    const name = form.name.trim();
    if (!name) { setError('Название обязательно'); return; }
    const same = items.find((i) => i.id !== editing?.id && i.name.trim().toLowerCase() === name.toLowerCase());
    if (same) { setError('«' + same.name + '» уже есть. Измени его через карандаш.'); return; }
    setSaving(true);
    setError('');
    const payload = {
      name,
      unit: form.unit.trim() || 'шт',
      quantity: Number(form.quantity) || 0,
      min_threshold: Number(form.min_threshold) || 0,
      section: zone === 'all' ? form.section : zone,
      cost_price: Number(form.cost_price) || 0,
      updated_at: new Date().toISOString(),
    };
    const query = editing
      ? supabase.from('ingredients').update(payload).eq('id', editing.id).select('id').single()
      : supabase.from('ingredients').insert([payload]).select('id').single();
    const { error: saveError } = await query;
    setSaving(false);
    if (saveError) { const t = friendlyError(saveError); setError(t); toast.error(t); return; }
    toast.success(editing ? `Ингредиент «${name}» обновлён` : `Ингредиент «${name}» сохранён`);
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    await load();
  };

  const askRemove = async (item: Ing) => {
    setConfirmId(item.id);
    setUsage(null);
    const { count } = await supabase.from('product_ingredients').select('id', { count: 'exact', head: true }).eq('ingredient_id', item.id);
    setUsage(count ?? 0);
  };

  const remove = async (item: Ing) => {
    if (deleting) return;
    setError('');
    setDeleting(true);
    const fail = (t: string) => { setError(t); toast.error(t); setDeleting(false); setConfirmId(null); };
    // Удаление разрешено только администратору (RLS). Без прав Supabase молча удаляет 0 строк,
    // поэтому просим вернуть удалённые строки и проверяем, что что-то действительно удалилось.
    if (usage) {
      const { data: links, error: linkError } = await supabase.from('product_ingredients').delete().eq('ingredient_id', item.id).select('id');
      if (linkError) return fail(friendlyError(linkError, 'Не удалось удалить'));
      if (!links?.length) return fail('Удалять может только администратор.');
    }
    const { data: deleted, error: delError } = await supabase.from('ingredients').delete().eq('id', item.id).select('id');
    if (delError) return fail(friendlyError(delError, 'Не удалось удалить'));
    if (!deleted?.length) return fail('Удалять может только администратор.');
    toast.success(`Ингредиент «${item.name}» удалён`);
    setDeleting(false);
    setConfirmId(null);
    await load();
  };

  const tabs = (zone === 'all'
    ? [['all', 'Все'], ['coffee', 'Кофейня'], ['kitchen', 'Кухня']]
    : [[zone, zoneLabel(zone)]]) as [typeof tab, string][];

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">Ингредиенты · {zoneLabel(zone)}</h1>
          <p className="text-[#C8A77E] mt-1">Зона переключается кнопками в меню.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center justify-center gap-2 px-6 py-3"><Plus className="w-5 h-5" /> Добавить</button>
      </div>
      {error && <div className="mb-4 rounded-2xl bg-red-900/40 border border-red-700 text-red-100 px-4 py-3">{error}</div>}
      <div className="flex flex-col md:flex-row gap-2 mb-5">
        <div className="flex gap-2">
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-2xl text-sm ${tab === key ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#2C241E] text-white border border-[#5C4030]'}`}>{label}</button>
          ))}
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Найти по названию" className="md:ml-auto bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-2 text-white w-full md:w-72" />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="text-left border-b border-[#5C4030] text-[#C8A77E] text-sm">
              <th className="p-4">Название</th><th className="p-4">Ед.</th><th className="p-4">Остаток</th><th className="p-4">Мин.</th><th className="p-4">Себест.</th><th className="p-4">Секция</th><th className="p-4 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Ничего не найдено</td></tr>}
            {visible.map((item) => (
              <tr key={item.id} className="border-t border-[#5C4030]">
                <td className="p-3">
                  {renameId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRename(item); if (e.key === 'Escape') setRenameId(null); }} className="flex-1 bg-[#2C241E] border border-[#C8A77E] rounded-xl px-3 py-2 text-white" />
                      <button type="button" disabled={renaming} onClick={() => saveRename(item)} className="p-2 rounded-xl bg-[#C8A77E] text-[#3F2A1F]"><Check className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setRenameId(null)} className="p-2 rounded-xl border border-[#5C4030] text-gray-300"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startRename(item)} className="text-left text-white font-medium hover:text-[#C8A77E]">{item.name}</button>
                  )}
                </td>
                <td className="p-4 text-gray-400">{item.unit}</td>
                <td className="p-4 font-mono text-white">{Number(item.quantity)}</td>
                <td className="p-4 text-gray-400">{Number(item.min_threshold)}</td>
                <td className="p-4 text-gray-300">{Number(item.cost_price || 0)} с</td>
                <td className="p-4 text-[#C8A77E]">{item.section === 'kitchen' ? 'Кухня' : 'Кофейня'}</td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => startRename(item)} className="px-3 py-2 rounded-xl bg-[#2C241E] border border-[#5C4030] text-[#C8A77E] text-xs">Переименовать</button>
                    <button type="button" onClick={() => openEdit(item)} title="Изменить" aria-label={`Изменить ${item.name}`} className="p-2 rounded-xl bg-[#2C241E] border border-[#5C4030] text-[#C8A77E]"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => askRemove(item)} title="Удалить" aria-label={`Удалить ${item.name}`} className="p-2 rounded-xl bg-[#2C241E] border border-[#5C4030] text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-3">
          <div className="bg-[#3F2A1F] rounded-3xl p-6 w-full max-w-md space-y-3 relative">
            <button type="button" onClick={() => { if (!saving) setOpen(false); }} aria-label="Закрыть" className="absolute right-4 top-4 text-gray-400"><X /></button>
            <h2 className="text-2xl text-white pr-8">{editing ? 'Изменить ингредиент' : 'Новый ингредиент'}</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" aria-label="Название" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="кг / л / шт" aria-label="Единица измерения" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-[#C8A77E]">Остаток
                <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
              </label>
              <label className="text-sm text-[#C8A77E]">Мин. остаток
                <input type="number" step="0.01" value={form.min_threshold} onChange={(e) => setForm({ ...form, min_threshold: Number(e.target.value) })} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
              </label>
            </div>
            <label className="text-sm text-[#C8A77E] block">Себестоимость за 1 ед.
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
            </label>
            {zone === 'all' && (
              <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value as 'coffee' | 'kitchen' })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white">
                <option value="coffee">Кофейня</option>
                <option value="kitchen">Кухня</option>
              </select>
            )}
            {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} disabled={saving} className="flex-1 py-3 rounded-2xl border border-[#5C4030] text-white disabled:opacity-50">Отмена</button>
              <button type="button" onClick={save} disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение…</> : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
      {confirmId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3">
          <div className="bg-[#3F2A1F] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xl text-white">Удалить ингредиент?</h2>
            <p className="text-sm text-gray-300">
              {usage === null ? 'Проверяем, где он используется…' : usage > 0 ? `Он есть в техкартах (${usage}). Из них он тоже будет убран.` : 'В техкартах не используется.'}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmId(null)} disabled={deleting} className="flex-1 py-3 rounded-2xl border border-[#5C4030] text-white">Нет</button>
              <button type="button" disabled={deleting || usage === null} onClick={() => { const item = items.find((i) => i.id === confirmId); if (item) remove(item); }} className="flex-1 py-3 rounded-2xl bg-red-700 text-white disabled:opacity-50">{deleting ? 'Удаление…' : 'Удалить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
