'use client';

import { useEffect, useMemo, useState } from 'react';
import { EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Product = {
  id: string;
  name: string;
  category?: string;
  section?: string;
  track_stock?: boolean;
  is_active?: boolean;
  hidden_from_techcards?: boolean;
};
type Ing = { id: string; name: string; unit: string };
type Line = { id?: string; ingredient_id: string; name: string; quantity: number; unit: string };
type Zone = 'coffee' | 'kitchen' | 'general';

const ZONES: { id: Zone | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'coffee', label: 'Кофейня' },
  { id: 'kitchen', label: 'Кухня' },
  { id: 'general', label: 'Общее' },
];

function zoneOf(p: Product): Zone {
  const cat = (p.category || '').toLowerCase();
  const name = p.name.toLowerCase();
  if (cat === 'kitchen' || cat === 'desserts') return 'kitchen';
  const bottled =
    p.track_stock === true ||
    cat === 'drinks' ||
    name.includes("a'su") ||
    name.includes('asu still') ||
    name.includes('asu carbon') ||
    name.includes('asu vo') ||
    name.includes('coca') ||
    name.includes('fanta') ||
    name.includes('sprite') ||
    name.includes('bonaqua') ||
    name.includes('piala') ||
    name.includes('живая сила') ||
    name.includes('квас') ||
    name.includes('piko') ||
    name.includes('schweppes') ||
    name.includes('fuse tea') ||
    /nitro .+\d/.test(name);
  if (bottled || cat === 'asu' || cat === 'drinks') return 'general';
  return 'coffee';
}

export default function TechcardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ings, setIngs] = useState<Ing[]>([]);
  const [zone, setZone] = useState<Zone | 'all'>('coffee');
  const [showHidden, setShowHidden] = useState(false);
  const [current, setCurrent] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState(0.018);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [error, setError] = useState('');

  const loadMeta = async () => {
    const { data: p, error: perr } = await supabase
      .from('products')
      .select('id, name, category, section, track_stock, is_active, hidden_from_techcards')
      .order('name');
    if (perr) {
      const fallback = await supabase.from('products').select('id, name, category, section, track_stock').order('name');
      setProducts((fallback.data || []).map((x: Product) => ({ ...x, hidden_from_techcards: false })));
    } else setProducts((p || []) as Product[]);
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

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      const hidden = p.hidden_from_techcards === true || p.is_active === false;
      if (showHidden ? !hidden : hidden) return false;
      if (zone === 'all') return true;
      return zoneOf(p) === zone;
    });
  }, [products, zone, showHidden]);

  const currentProduct = products.find((p) => p.id === current);

  const addLine = async () => {
    if (!current || !pick) return;
    const ing = ings.find((i) => i.id === pick);
    const { error: insErr } = await supabase.from('product_ingredients').insert([
      { product_id: current, ingredient_id: pick, quantity: qty, unit: ing?.unit || 'шт' },
    ]);
    if (insErr) setError(insErr.message);
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

  const hideProduct = async (id: string) => {
    const { error: hideErr } = await supabase.from('products').update({ hidden_from_techcards: true }).eq('id', id);
    if (hideErr) {
      setError('SQl: ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_from_techcards BOOLEAN NOT NULL DEFAULT false;');
      return;
    }
    if (current === id) { setCurrent(''); setLines([]); }
    await loadMeta();
  };

  const restoreProduct = async (id: string) => {
    await supabase.from('products').update({ hidden_from_techcards: false }).eq('id', id);
    await loadMeta();
  };

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Техкарты</h1>
          <p className="text-[#C8A77E] mt-1">Кофейня, кухня и общее. Скрытие убирает товар только из этого списка, не из базы.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#C8A77E]">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          Показать скрытые
        </label>
      </div>
      {error && <div className="mb-4 rounded-2xl bg-red-900/40 border border-red-700 text-red-100 px-4 py-3 text-sm">{error}</div>}
      <div className="flex flex-wrap gap-2 mb-5">
        {ZONES.map((z) => (
          <button key={z.id} type="button" onClick={() => setZone(z.id)} className={`px-4 py-2 rounded-2xl text-sm ${
            zone === z.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#2C241E] text-white border border-[#5C4030]'
          }`}>{z.label}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-3 max-h-[70vh] overflow-auto">
          {visibleProducts.length === 0 && <p className="p-4 text-gray-400 text-sm">В этой зоне пусто</p>}
          {visibleProducts.map((p) => (
            <div key={p.id} className={`flex items-center gap-2 rounded-2xl mb-1 px-2 ${
              current === p.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'hover:bg-[#5C4030] text-white'
            }`}>
              <button type="button" onClick={() => loadRecipe(p.id)} className="flex-1 text-left px-3 py-3">
                <span className="block">{p.name}</span>
                <span className={`text-xs ${current === p.id ? 'text-[#3F2A1F]/70' : 'text-[#C8A77E]'}`}>
                  {zoneOf(p) === 'kitchen' ? 'Кухня' : zoneOf(p) === 'general' ? 'Общее' : 'Кофейня'}
                  {p.hidden_from_techcards || p.is_active === false ? ' · скрыт' : ''}
                </span>
              </button>
              {p.hidden_from_techcards || p.is_active === false ? (
                <button type="button" onClick={() => restoreProduct(p.id)} className="text-xs px-2 py-1 rounded-xl border border-[#5C4030]">Вернуть</button>
              ) : (
                <button type="button" title="Скрыть из техкарт" onClick={() => hideProduct(p.id)} className={`p-2 ${current === p.id ? 'text-[#3F2A1F]' : 'text-gray-400'}`}>
                  <EyeOff className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="card p-6">
          {!current && <p className="text-gray-400">Выбери товар слева</p>}
          {current && (
            <>
              <h2 className="text-2xl text-white mb-1">{currentProduct?.name}</h2>
              <p className="text-sm text-[#C8A77E] mb-5">Рецепт. Удаление строки не трогает ингредиент на складе.</p>
              <div className="space-y-2 mb-6">
                {lines.length === 0 && <p className="text-gray-400">Рецепта ещё нет — это нормально для бутылок</p>}
                {lines.map((l) => (
                  <div key={l.id || l.ingredient_id} className="flex items-center gap-3 bg-[#2C241E] rounded-2xl px-4 py-3">
                    <span className="flex-1 text-white">{l.name}</span>
                    {editId === l.id ? (
                      <>
                        <input type="number" step="0.001" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-24 bg-[#3F2A1F] rounded-xl px-2 py-1 text-white" />
                        <button type="button" onClick={() => saveQty(l.id)} className="text-emerald-400">OK</button>
                      </>
                    ) : (
                      <button type="button" className="font-mono text-[#C8A77E]" onClick={() => { setEditId(l.id || null); setEditQty(l.quantity); }}>{l.quantity} {l.unit}</button>
                    )}
                    <button type="button" onClick={() => removeLine(l.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <select value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3 text-white">
                  <option value="">Ингредиент</option>
                  {ings.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input type="number" step="0.001" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-28 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3 text-white" />
                <button type="button" onClick={addLine} className="btn-primary px-4">+</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
