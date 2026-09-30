'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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

const emptyForm: FormState = {
  name: '',
  unit: 'кг',
  quantity: 0,
  min_threshold: 5,
  section: 'coffee',
  cost_price: 0,
};

export default function IngredientsPage() {
  const [items, setItems] = useState<Ing[]>([]);
  const [tab, setTab] = useState<'all' | 'coffee' | 'kitchen'>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ing | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    const { data, error: loadError } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setItems((data || []) as Ing[]);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => (tab === 'all' ? items : items.filter((i) => i.section === tab)),
    [items, tab]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
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

  const save = async () => {
    if (!form.name.trim()) {
      setError('Название обязательно');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim() || 'шт',
      quantity: Number(form.quantity) || 0,
      min_threshold: Number(form.min_threshold) || 0,
      section: form.section,
      cost_price: Number(form.cost_price) || 0,
      updated_at: new Date().toISOString(),
    };

    const query = editing
      ? supabase.from('ingredients').update(payload).eq('id', editing.id)
      : supabase.from('ingredients').insert([payload]);

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setOpen(false);
    setEditing(null);
    await load();
  };

  const remove = async (item: Ing) => {
    setError('');
    const { error: unlinkError } = await supabase
      .from('product_ingredients')
      .delete()
      .eq('ingredient_id', item.id);

    if (unlinkError) {
      setError('Не удалось отвязать от рецептов: ' + unlinkError.message);
      setConfirmId(null);
      return;
    }

    const { error: delError } = await supabase.from('ingredients').delete().eq('id', item.id);

    if (delError) {
      setError(delError.message);
      setConfirmId(null);
      return;
    }

    setConfirmId(null);
    await load();
  };

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Ингредиенты
          </h1>
          <p className="text-[#C8A77E] mt-1">
            Из этого собираются блюда и напитки. Можно править и удалять.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5" />
          Добавить
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-900/40 border border-red-700 text-red-100 px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {(
          [
            ['all', 'Все'],
            ['coffee', 'Кофейня'],
            ['kitchen', 'Кухня'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-2xl text-sm ${
              tab === key
                ? 'bg-[#C8A77E] text-[#3F2A1F]'
                : 'bg-[#2C241E] text-white border border-[#5C4030]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="text-left border-b border-[#5C4030] text-[#C8A77E] text-sm">
              <th className="p-4">Название</th>
              <th className="p-4">Ед.</th>
              <th className="p-4">Остаток</th>
              <th className="p-4">Мин.</th>
              <th className="p-4">Себест.</th>
              <th className="p-4">Секция</th>
              <th className="p-4 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  Пока пусто
                </td>
              </tr>
            )}
            {visible.map((item) => (
              <tr key={item.id} className="border-t border-[#5C4030]">
                <td className="p-4 text-white font-medium">{item.name}</td>
                <td className="p-4 text-gray-400">{item.unit}</td>
                <td className="p-4 font-mono text-white">{Number(item.quantity)}</td>
                <td className="p-4 text-gray-400">{Number(item.min_threshold)}</td>
                <td className="p-4 text-gray-300">{Number(item.cost_price || 0)} с</td>
                <td className="p-4 text-[#C8A77E]">
                  {item.section === 'kitchen' ? 'Кухня' : 'Кофейня'}
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-xl bg-[#2C241E] border border-[#5C4030] text-[#C8A77E]"
                      title="Редактировать"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmId(item.id)}
                      className="p-2 rounded-xl bg-[#2C241E] border border-[#5C4030] text-red-400"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-gray-400">
              <X />
            </button>
            <h2 className="text-2xl text-white pr-8">
              {editing ? 'Изменить ингредиент' : 'Новый ингредиент'}
            </h2>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Название"
              className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white"
            />
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="кг / л / шт"
              className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-[#C8A77E]">
                Остаток
                <input
                  type="number"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white"
                />
              </label>
              <label className="text-sm text-[#C8A77E]">
                Мин. остаток
                <input
                  type="number"
                  step="0.01"
                  value={form.min_threshold}
                  onChange={(e) => setForm({ ...form, min_threshold: Number(e.target.value) })}
                  className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white"
                />
              </label>
            </div>
            <label className="text-sm text-[#C8A77E] block">
              Себестоимость за 1 ед.
              <input
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white"
              />
            </label>
            <select
              value={form.section}
              onChange={(e) =>
                setForm({ ...form, section: e.target.value as 'coffee' | 'kitchen' })
              }
              className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white"
            >
              <option value="coffee">Кофейня</option>
              <option value="kitchen">Кухня</option>
            </select>
            {error && <p className="text-red-300 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-[#5C4030] text-white"
              >
                Отмена
              </button>
              <button onClick={save} disabled={saving} className="flex-1 btn-primary py-3 disabled:opacity-50">
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3">
          <div className="bg-[#3F2A1F] rounded-3xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-xl text-white">Удалить ингредиент?</h2>
            <p className="text-sm text-gray-300">
              Он снимется со склада и отвяжется от техкарт. Продажи не удаляются.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-2xl border border-[#5C4030] text-white"
              >
                Нет
              </button>
              <button
                onClick={() => {
                  const item = items.find((i) => i.id === confirmId);
                  if (item) remove(item);
                }}
                className="flex-1 py-3 rounded-2xl bg-red-700 text-white"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
