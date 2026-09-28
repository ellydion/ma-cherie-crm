'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Product = {
  id?: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  section: string;
  track_stock: boolean;
};

const CATS = [
  { id: 'all', label: 'Все' },
  { id: 'coffee', label: 'Кофе' },
  { id: 'nitro', label: 'Нитро' },
  { id: 'asu', label: 'Асу / Айс' },
  { id: 'kitchen', label: 'Кухня' },
  { id: 'drinks', label: 'Напитки' },
  { id: 'desserts', label: 'Десерты' },
];

const empty: Product = {
  name: '', price: 0, category: 'coffee', unit: 'шт', section: 'coffee', track_stock: false,
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Product>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error: err } = await supabase.from('products').select('id, name, price, category, unit, section, track_stock').order('name');
    if (err) setError(err.message);
    else setItems((data || []) as Product[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((p) => {
    const okCat = cat === 'all' || p.category === cat;
    const okSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return okCat && okSearch;
  });

  const openNew = () => { setForm(empty); setError(''); setOpen(true); };
  const openEdit = (p: Product) => { setForm({ ...p, track_stock: !!p.track_stock }); setError(''); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { setError('Название обязательно'); return; }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      category: form.category,
      unit: form.unit || 'шт',
      section: form.category === 'kitchen' || form.category === 'desserts' ? 'kitchen' : 'coffee',
      track_stock: !!form.track_stock,
    };
    const { error: err } = form.id
      ? await supabase.from('products').update(payload).eq('id', form.id)
      : await supabase.from('products').insert([payload]);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setOpen(false);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-semibold">Товары</h1>
          <p className="text-[#C8A77E]">Только то, что продаётся на кассе</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary px-8 py-4 flex items-center gap-2">
          <Plus /> Добавить товар
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {CATS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-5 py-3 rounded-3xl ${cat === c.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#3F2A1F]'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" className="w-full bg-[#3F2A1F] border border-[#5C4030] rounded-3xl px-6 py-4 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map((p) => (
          <button type="button" key={p.id} onClick={() => openEdit(p)} className="card p-5 text-left">
            <div className="flex justify-between"><p className="font-semibold text-lg">{p.name}</p><Pencil className="w-4 h-4 text-[#C8A77E]" /></div>
            <p className="text-[#C8A77E] text-sm">{CATS.find((c) => c.id === p.category)?.label || p.category}</p>
            <p className="text-3xl font-mono mt-4">{p.price} с</p>
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-2xl">{form.id ? 'Изменить товар' : 'Новый товар'}</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="Цена" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4">
              {CATS.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <label className="flex gap-3 items-center"><input type="checkbox" checked={form.track_stock} onChange={(e) => setForm({ ...form, track_stock: e.target.checked })} /> Готовый товар на складе</label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-3xl border border-[#5C4030]">Отмена</button>
              <button type="button" onClick={save} disabled={saving} className="flex-1 btn-primary py-3">{saving ? '...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
