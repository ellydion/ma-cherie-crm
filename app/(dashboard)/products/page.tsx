'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  section: string;
  track_stock?: boolean;
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('coffee');
  const [track, setTrack] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setItems((data || []).filter((p: any) => p.is_ingredient !== true));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name) return;
    await supabase.from('products').insert([{
      name, price, category, section: category === 'coffee' || category === 'drinks' ? 'coffee' : 'kitchen',
      unit: 'шт', quantity: track ? 0 : 999, min_threshold: 5, is_ingredient: false, track_stock: track,
    }]);
    setOpen(false);
    setName('');
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-4xl font-semibold">Товары</h1>
          <p className="text-[#C8A77E]">Только то, что продаётся на кассе</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary px-8 py-4 flex items-center gap-2"><Plus /> Добавить товар</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((p) => (
          <div key={p.id} className="card p-5">
            <p className="font-semibold text-lg">{p.name}</p>
            <p className="text-[#C8A77E] text-sm capitalize">{p.category}</p>
            <p className="text-3xl font-mono mt-4">{p.price} с</p>
            {p.track_stock && <p className="text-xs text-emerald-400 mt-2">Учитывается на складе</p>}
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#3F2A1F] rounded-3xl p-8 w-full max-w-md space-y-4">
            <h2 className="text-2xl">Новый товар</h2>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Цена" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-5 py-4">
              <option value="coffee">Кофе</option>
              <option value="kitchen">Кухня</option>
              <option value="drinks">Напитки</option>
              <option value="desserts">Десерты</option>
            </select>
            <label className="flex gap-3 items-center"><input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} /> Готовый товар на складе (кола, вода)</label>
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
