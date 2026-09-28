'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Product = { id: string; name: string };
type Ing = { id: string; name: string; unit: string };
type Line = { id?: string; ingredient_id: string; name: string; quantity: number; unit: string };

export default function TechcardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ings, setIngs] = useState<Ing[]>([]);
  const [current, setCurrent] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState(0.018);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);

  const loadMeta = async () => {
    const { data: p } = await supabase.from('products').select('id, name').order('name');
    setProducts(p || []);
    const { data: i } = await supabase.from('ingredients').select('id, name, unit').order('name');
    setIngs(i || []);
  };

  const loadRecipe = async (productId: string) => {
    setCurrent(productId);
    setEditId(null);
    const { data } = await supabase
      .from('product_ingredients')
      .select('id, ingredient_id, quantity, unit, ingredients(name)')
      .eq('product_id', productId);
    setLines((data || []).map((r: any) => ({
      id: r.id,
      ingredient_id: r.ingredient_id,
      name: r.ingredients?.name || '',
      quantity: Number(r.quantity),
      unit: r.unit,
    })));
  };

  useEffect(() => { loadMeta(); }, []);

  const addLine = async () => {
    if (!current || !pick) return;
    const ing = ings.find((i) => i.id === pick);
    await supabase.from('product_ingredients').insert([{
      product_id: current, ingredient_id: pick, quantity: qty, unit: ing?.unit || 'шт',
    }]);
    loadRecipe(current);
  };

  const saveQty = async (id?: string) => {
    if (!id) return;
    await supabase.from('product_ingredients').update({ quantity: editQty }).eq('id', id);
    setEditId(null);
    loadRecipe(current);
  };

  const removeLine = async (id?: string) => {
    if (!id) return;
    await supabase.from('product_ingredients').delete().eq('id', id);
    loadRecipe(current);
  };

  return (
    <div>
      <h1 className="text-4xl font-semibold">Техкарты</h1>
      <p className="text-[#C8A77E] mb-8">Можно добавлять, менять количество и удалять строки рецепта</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-4 max-h-[70vh] overflow-auto">
          {products.map((p) => (
            <button key={p.id} type="button" onClick={() => loadRecipe(p.id)} className={`w-full text-left px-4 py-3 rounded-2xl mb-1 ${current === p.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'hover:bg-[#5C4030]'}`}>
              {p.name}
            </button>
          ))}
        </div>
        <div className="card p-6">
          {!current && <p className="text-gray-400">Выбери товар слева</p>}
          {current && (
            <>
              <div className="space-y-2 mb-6">
                {lines.length === 0 && <p className="text-gray-400">Рецепта ещё нет</p>}
                {lines.map((l) => (
                  <div key={l.id || l.ingredient_id} className="flex items-center gap-3 bg-[#2C241E] rounded-2xl px-4 py-3">
                    <span className="flex-1">{l.name}</span>
                    {editId === l.id ? (
                      <>
                        <input type="number" step="0.001" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-24 bg-[#3F2A1F] rounded-xl px-2 py-1" />
                        <button type="button" onClick={() => saveQty(l.id)} className="text-emerald-400">OK</button>
                      </>
                    ) : (
                      <button type="button" className="font-mono text-[#C8A77E]" onClick={() => { setEditId(l.id || null); setEditQty(l.quantity); }}>
                        {l.quantity} {l.unit}
                      </button>
                    )}
                    <button type="button" onClick={() => removeLine(l.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3">
                  <option value="">Ингредиент</option>
                  {ings.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input type="number" step="0.001" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-28 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3" />
                <button type="button" onClick={addLine} className="btn-primary px-4">+</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
