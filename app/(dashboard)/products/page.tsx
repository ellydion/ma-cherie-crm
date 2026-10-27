'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useZone } from '@/lib/useZone';
import { visibleInZone, zoneLabel } from '@/lib/zone';
import { useSettings } from '@/lib/store/settingsStore';
import { toast } from '@/lib/store/toastStore';
import { friendlyError } from '@/lib/errors';

type Product = { id?: string; name: string; price: number; category: string; unit: string; section: string; track_stock: boolean; hidden_from_techcards?: boolean | null };

const CATS = [
  { id: 'all', label: 'Все' }, { id: 'coffee', label: 'Кофе' }, { id: 'nitro', label: 'Нитро' },
  { id: 'asu', label: 'Асу / Айс' }, { id: 'kitchen', label: 'Кухня' }, { id: 'drinks', label: 'Напитки' }, { id: 'desserts', label: 'Десерты' },
];

const empty: Product = { name: '', price: 0, category: 'coffee', unit: 'шт', section: 'coffee', track_stock: false };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export default function ProductsPage() {
  const { zone } = useZone();
  const dessertsInCoffee = useSettings().pos.dessertsInCoffee;
  const [items, setItems] = useState<Product[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Product>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [dupConfirmed, setDupConfirmed] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // Убранные в техкартах (дубли, снятые позиции) по умолчанию не показываем.
  const [showHidden, setShowHidden] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error: err } = await supabase.from('products').select('id, name, price, category, unit, section, track_stock, hidden_from_techcards').order('name');
    if (err) { toast.error(friendlyError(err, 'Не удалось загрузить товары')); return; }
    setItems((data || []) as Product[]);
  };

  useEffect(() => { load(); }, []);

  // Подсветка только что сохранённого товара: прокрутить к нему и через пару секунд снять.
  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`product-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId, items]);

  const hiddenCount = items.filter((p) => p.hidden_from_techcards && visibleInZone(p, zone, dessertsInCoffee)).length;
  const filtered = items.filter((p) => {
    if (!visibleInZone(p, zone, dessertsInCoffee)) return false;
    if (p.hidden_from_techcards && !showHidden && p.id !== highlightId) return false;
    return (cat === 'all' || p.category === cat) && p.name.toLowerCase().includes(search.toLowerCase());
  });

  const freshForm = (category?: string): Product => {
    const c = category || (zone === 'kitchen' ? 'kitchen' : 'coffee');
    return { ...empty, category: c, section: c === 'kitchen' || c === 'desserts' ? 'kitchen' : 'coffee' };
  };

  const resetMessages = () => { setError(''); setSavedNote(''); setDupConfirmed(false); };

  const openNew = () => {
    setForm(freshForm());
    resetMessages();
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    const { hidden_from_techcards: _hidden, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
    setForm({ ...rest, track_stock: !!p.track_stock });
    resetMessages();
    setOpen(true);
  };
  const close = () => { if (saving) return; setOpen(false); resetMessages(); };

  const save = async (addAnother = false) => {
    if (saving) return;
    const name = form.name.trim();
    if (!name) { setError('Название обязательно'); nameRef.current?.focus(); return; }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) { setError('Цена должна быть числом не меньше 0'); return; }

    // Защита от дублей: такой же товар уже есть. Второе нажатие сохраняет всё равно.
    const dup = items.find((p) => p.id !== form.id && norm(p.name) === norm(name));
    if (dup && !dupConfirmed) {
      setError(`Товар «${dup.name}» уже есть (${dup.price} с${dup.hidden_from_techcards ? ', убран' : ''}). Нажми «Сохранить» ещё раз, если это действительно другой товар.`);
      setDupConfirmed(true);
      return;
    }

    setSaving(true);
    setError('');
    setSavedNote('');
    const isNew = !form.id;
    const section = form.category === 'kitchen' || form.category === 'desserts' ? 'kitchen' : 'coffee';
    const payload = { name, price, category: form.category, unit: form.unit || 'шт', section, track_stock: !!form.track_stock };
    try {
      const { data, error: err } = isNew
        ? await supabase.from('products').insert([payload]).select('id').single()
        : await supabase.from('products').update(payload).eq('id', form.id as string).select('id').single();
      if (err) throw err;

      const message = isNew ? `Товар «${name}» сохранён` : `Изменения в «${name}» сохранены`;
      toast.success(message);
      await load();
      if (data?.id) setHighlightId(String(data.id));

      if (isNew && addAnother) {
        // Оставляем окно открытым с чистой карточкой той же категории.
        setForm(freshForm(form.category));
        setDupConfirmed(false);
        setSavedNote(message + '. Можно добавить следующий.');
        nameRef.current?.focus();
      } else {
        // Сброс карточки и закрытие окна.
        setForm(freshForm());
        setOpen(false);
        resetMessages();
        // Чтобы новый товар точно был виден в списке.
        if (isNew) { setSearch(''); setCat('all'); }
      }
    } catch (err) {
      const text = friendlyError(err);
      setError(text);
      toast.error(text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">Товары · {zoneLabel(zone)}</h1>
          <p className="text-[#C8A77E] text-sm sm:text-base">То, что продаётся на кассе этой зоны</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary px-5 py-3 flex items-center justify-center gap-2 w-full sm:w-auto"><Plus className="w-5 h-5" /> Добавить товар</button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {CATS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-4 py-2 rounded-2xl text-sm ${cat === c.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#3F2A1F]'}`}>{c.label}</button>
        ))}
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" aria-label="Поиск товара" className="w-full bg-[#3F2A1F] border border-[#5C4030] rounded-2xl px-4 py-3 mb-3" />
      <label className="flex items-center gap-2 text-sm text-[#C8A77E] mb-6 cursor-pointer w-fit">
        <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="w-4 h-4 accent-[#C8A77E]" />
        Показать убранные{hiddenCount ? ` (${hiddenCount})` : ''}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {filtered.map((p) => (
          <button
            type="button"
            key={p.id}
            id={`product-${p.id}`}
            onClick={() => openEdit(p)}
            className={`card p-4 text-left transition-shadow ${highlightId === p.id ? 'ring-4 ring-emerald-400' : ''} ${p.hidden_from_techcards ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between gap-2"><p className="font-semibold text-base sm:text-lg line-clamp-2">{p.name}</p><Pencil className="w-4 h-4 text-[#C8A77E] shrink-0" /></div>
            <p className="text-[#C8A77E] text-xs sm:text-sm mt-1">{CATS.find((c) => c.id === p.category)?.label || p.category}{p.hidden_from_techcards ? ' · убран' : ''}</p>
            <p className="text-2xl sm:text-3xl font-mono mt-3">{p.price} с</p>
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); save(false); }}
            aria-busy={saving}
            className="bg-[#3F2A1F] rounded-3xl p-5 sm:p-8 w-full max-w-md space-y-4"
          >
            <h2 className="text-xl sm:text-2xl">{form.id ? 'Изменить товар' : 'Новый товар'}</h2>
            {savedNote && (
              <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-900/60 border border-emerald-600 text-emerald-100 px-4 py-3 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {savedNote}
              </p>
            )}
            <fieldset disabled={saving} className="space-y-4">
              <label className="block text-sm text-[#C8A77E]">Название
                <input ref={nameRef} autoFocus value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setDupConfirmed(false); }} placeholder="Например, Латте 350 мл" className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
              </label>
              <label className="block text-sm text-[#C8A77E]">Цена, с
                <input type="number" min={0} inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
              </label>
              <label className="block text-sm text-[#C8A77E]">Категория
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white">
                  {CATS.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </label>
              <label className="flex gap-3 items-center"><input type="checkbox" checked={form.track_stock} onChange={(e) => setForm({ ...form, track_stock: e.target.checked })} /> Готовый товар на складе</label>
            </fieldset>
            {error && <p role="alert" className="rounded-2xl bg-red-900/40 border border-red-700 text-red-100 px-4 py-3 text-sm">{error}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={close} disabled={saving} className="flex-1 py-3 rounded-2xl border border-[#5C4030] disabled:opacity-50">Отмена</button>
              {!form.id && (
                <button type="button" onClick={() => save(true)} disabled={saving} className="flex-1 py-3 rounded-2xl border border-[#C8A77E] text-[#C8A77E] disabled:opacity-50">Сохранить и ещё</button>
              )}
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение…</> : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
