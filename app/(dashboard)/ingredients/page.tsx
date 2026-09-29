'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/excel';

type Ing = { id: string; name: string; unit: string; quantity: number; min_threshold: number; section: string };

export default function IngredientsPage() {
  const [items, setItems] = useState<Ing[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'кг', quantity: 0, min_threshold: 5, section: 'coffee' });

  const load = async () => {
    const { data } = await supabase.from('ingredients').select('*').order('name');
    if (data) setItems(data);
    else {
      const { data: fallback } = await supabase.from('products').select('*').eq('is_ingredient', true).order('name');
      setItems((fallback || []) as Ing[]);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return;
    const { error } = await supabase.from('ingredients').insert([form]);
    if (error) await supabase.from('products').insert([{ ...form, price: 0, category: form.section, is_ingredient: true }]);
    setOpen(false);
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-4xl font-semibold">Ингредиенты</h1>
          <p className="text-[#C8A77E]">Из этого собираются товары по техкарте</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => downloadXlsx('ingredienty.xlsx', items.map((x) => ({
            'название': x.name, 'единица': x.unit, 'остаток': x.quantity, 'минимум': x.min_threshold, 'секция': x.section,
          })))} className="px-6 py-4 rounded-3xl border border-[#5C4030]">Excel</button>
          <button onClick={() => setOpen(true)} className="btn-primary px-8 py-4 flex items-center gap-2"><Plus /> Добавить</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="text-left border-b border-[#5C4030]"><th className="p-5">Название</th><th className="p-5">Ед.</th><th className="p-5">Секция</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-[#5C4030]">
                <td className="p-5">{i.name}</td>
                <td className="p-5 text-gray-400">{i.unit}</td>
                <td className="p-5 text-[#C8A77E]">{i.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-2xl">Новый ингредиент</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Зерно, молоко..." className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="кг / л / шт" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4">
              <option value="coffee">Кофейня</option>
              <option value="kitchen">Кухня</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 rounded-3xl border border-[#5C4030]">Отмена</button>
              <button onClick={save} className="flex-1 btn-primary py-3">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
