'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Product = {
  id: string; name: string; category?: string; section?: string;
  track_stock?: boolean; is_active?: boolean; hidden_from_techcards?: boolean;
  price?: number; cost_price?: number;
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
  if (name.includes('айс') || name.includes('лимонад') || name.includes('мохито') || name.includes('бамбл')) return 'coffee';
  if (cat === 'kitchen' || cat === 'desserts') return 'kitchen';
  const bottled =
    name.includes("a'su") || name.includes('asu still') || name.includes('asu carbon') || name.includes('asu vo') ||
    name.includes('coca') || name.includes('fanta') || name.includes('sprite') || name.includes('bonaqua') ||
    name.includes('piala') || name.includes('живая сила') || name.includes('квас') ||
    name.includes('piko') || name.includes('schweppes') || name.includes('fuse tea') || /nitro .+\d/.test(name) ||
    (p.track_stock === true && (cat === 'drinks' || cat === 'asu' || cat === 'nitro'));
  if (bottled || cat === 'drinks') return 'general';
  return 'coffee';
}

function zoneToCategory(zone: Zone) {
  if (zone === 'kitchen') return 'kitchen';
  if (zone === 'general') return 'drinks';
  return 'coffee';
}

export default function TechcardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ings, setIngs] = useState<Ing[]>([]);
  const [zone, setZone] = useState<Zone | 'all'>('general');
  const [showHidden, setShowHidden] = useState(false);
  const [current, setCurrent] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState(0.018);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [sell, setSell] = useState(0);
  const [cost, setCost] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [error, setError] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newZone, setNewZone] = useState<Zone>('coffee');
  const [newPrice, setNewPrice] = useState(0);
  const [newCost, setNewCost] = useState(0);
  const [creating, setCreating] = useState(false);

  const loadMeta = async () => {
    const { data: p, error: perr } = await supabase
      .from('products')
      .select('id, name, category, section, track_stock, is_active, hidden_from_techcards, price, cost_price')
      .order('name');
    if (perr) {
      const fallback = await supabase.from('products').select('id, name, category, section, track_stock, price').order('name');
      setProducts((fallback.data || []).map((x: Product) => ({ ...x, hidden_from_techcards: false, cost_price: 0 })));
    } else setProducts((p || []) as Product[]);
    const { data: i } = await supabase.from('ingredients').select('id, name, unit').order('name');
    setIngs(i || []);
  };

  const openProduct = async (productId: string) => {
    setCurrent(productId);
    setEditId(null);
    const item = products.find((x) => x.id === productId);
    setSell(Number(item?.price) || 0);
    setCost(Number(item?.cost_price) || 0);
    setRenameValue(item?.name || '');
    if (item && zoneOf(item) === 'general') { setLines([]); return; }
    const { data } = await supabase.from('product_ingredients').select('id, ingredient_id, quantity, unit, ingredients(name)').eq('product_id', productId);
    setLines((data || []).map((r: any) => ({ id: r.id, ingredient_id: r.ingredient_id, name: r.ingredients?.name || '', quantity: Number(r.quantity), unit: r.unit })));
  };

  useEffect(() => { loadMeta(); }, []);

  const visibleProducts = useMemo(() => products.filter((p) => {
    const hidden = p.hidden_from_techcards === true || p.is_active === false;
    if (showHidden ? !hidden : hidden) return false;
    if (zone === 'all') return true;
    return zoneOf(p) === zone;
  }), [products, zone, showHidden]);

  const currentProduct = products.find((p) => p.id === current);
  const isGeneral = currentProduct ? zoneOf(currentProduct) === 'general' : false;

  const addLine = async () => {
    if (!current || !pick) return;
    const ing = ings.find((i) => i.id === pick);
    const { error: insErr } = await supabase.from('product_ingredients').insert([{ product_id: current, ingredient_id: pick, quantity: qty, unit: ing?.unit || 'шт' }]);
    if (insErr) setError(insErr.message);
    openProduct(current);
  };
  const saveQty = async (id?: string) => {
    if (!id) return;
    await supabase.from('product_ingredients').update({ quantity: editQty }).eq('id', id);
    setEditId(null); openProduct(current);
  };
  const removeLine = async (id?: string) => {
    if (!id) return;
    await supabase.from('product_ingredients').delete().eq('id', id);
    openProduct(current);
  };
  const savePrices = async () => {
    if (!current) return;
    setSavingPrice(true);
    const { error: upErr } = await supabase.from('products').update({ price: Number(sell) || 0, cost_price: Number(cost) || 0 }).eq('id', current);
    setSavingPrice(false);
    if (upErr) { setError(upErr.message); return; }
    await loadMeta();
  };
  const hideProduct = async (id: string) => {
    const { error: hideErr } = await supabase.from('products').update({ hidden_from_techcards: true }).eq('id', id);
    if (hideErr) { setError('ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_from_techcards BOOLEAN NOT NULL DEFAULT false;'); return; }
    if (current === id) { setCurrent(''); setLines([]); }
    await loadMeta();
  };
  const restoreProduct = async (id: string) => {
    await supabase.from('products').update({ hidden_from_techcards: false }).eq('id', id);
    await loadMeta();
  };

  const saveName = async () => {
    if (!current) return;
    const name = renameValue.trim();
    if (!name) { setError('Название обязательно'); return; }
    setRenaming(true);
    const { error: upErr } = await supabase.from('products').update({ name }).eq('id', current);
    setRenaming(false);
    if (upErr) { setError(upErr.message); return; }
    await loadMeta();
  };

  const createCard = async () => {
    const name = newName.trim();
    if (!name) { setError('Название обязательно'); return; }
    setCreating(true);
    setError('');
    const payload = {
      name,
      price: Number(newPrice) || 0,
      cost_price: Number(newCost) || 0,
      category: zoneToCategory(newZone),
      section: newZone === 'kitchen' ? 'kitchen' : 'coffee',
      unit: 'шт',
      track_stock: newZone === 'general',
    };
    const { data, error: insErr } = await supabase.from('products').insert([payload]).select('id').single();
    setCreating(false);
    if (insErr) { setError(insErr.message); return; }
    setCreateOpen(false);
    setNewName('');
    setNewPrice(0);
    setNewCost(0);
    await loadMeta();
    if (data?.id) {
      setZone(newZone);
      setTimeout(() => openProduct(data.id), 50);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">Техкарты</h1>
          <p className="text-[#C8A77E] mt-1 text-sm sm:text-base">Можно добавить новую и переименовать старую. Убрать не удаляет из базы.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="flex items-center gap-2 text-sm text-[#C8A77E]">
            <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Показать убранные
          </label>
          <button type="button" onClick={() => { setError(''); setCreateOpen(true); }} className="btn-primary flex items-center justify-center gap-2 px-5 py-3">
            <Plus className="w-5 h-5" /> Новая техкарта
          </button>
        </div>
      </div>
      {error && <div className="mb-4 rounded-2xl bg-red-900/40 border border-red-700 text-red-100 px-4 py-3 text-sm">{error}</div>}
      <div className="flex flex-wrap gap-2 mb-5">
        {ZONES.map((z) => (
          <button key={z.id} type="button" onClick={() => setZone(z.id)} className={`px-4 py-2 rounded-2xl text-sm ${
            zone === z.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#2C241E] text-white border border-[#5C4030]'
          }`}>{z.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-2 sm:p-3 max-h-[50vh] lg:max-h-[70vh] overflow-auto">
          {visibleProducts.length === 0 && <p className="p-4 text-gray-400 text-sm">В этой зоне пусто</p>}
          {visibleProducts.map((p) => (
            <div key={p.id} className={`flex items-center gap-2 rounded-2xl mb-1 px-2 ${
              current === p.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'hover:bg-[#5C4030] text-white'
            }`}>
              <button type="button" onClick={() => openProduct(p.id)} className="flex-1 text-left px-2 sm:px-3 py-3 min-w-0">
                <span className="block truncate">{p.name}</span>
                <span className={`text-xs ${current === p.id ? 'text-[#3F2A1F]/70' : 'text-[#C8A77E]'}`}>
                  {zoneOf(p) === 'general' ? `${Number(p.price || 0)} с` : zoneOf(p) === 'kitchen' ? 'Кухня' : 'Кофейня'}
                  {p.hidden_from_techcards ? ' · убран' : ''}
                </span>
              </button>
              {p.hidden_from_techcards || p.is_active === false ? (
                <button type="button" onClick={() => restoreProduct(p.id)} className="text-xs px-2 py-1 rounded-xl border border-[#5C4030] shrink-0">Вернуть</button>
              ) : (
                <button type="button" onClick={() => hideProduct(p.id)} className={`text-xs px-2 py-1 rounded-xl shrink-0 ${
                  current === p.id ? 'text-[#3F2A1F] border border-[#3F2A1F]/30' : 'text-red-300 border border-[#5C4030]'
                }`}>Убрать</button>
              )}
            </div>
          ))}
        </div>
        <div className="card p-4 sm:p-6">
          {!current && <p className="text-gray-400">Выбери товар слева</p>}
          {current && (
            <div className="mb-5 space-y-2">
              <label className="text-sm text-[#C8A77E] block">Название
                <div className="mt-1 flex gap-2">
                  <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="flex-1 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
                  <button type="button" onClick={saveName} disabled={renaming} className="btn-primary px-4" title="Сохранить название">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </label>
            </div>
          )}
          {current && isGeneral && (
            <>
              <p className="text-sm text-[#C8A77E] mb-4">Готовый напиток. Рецепта нет — только цена.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-[#C8A77E]">Цена продажи, с
                  <input type="number" step="1" value={sell} onChange={(e) => setSell(Number(e.target.value))} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white text-xl sm:text-2xl font-mono" />
                </label>
                <label className="text-sm text-[#C8A77E]">Себестоимость, с
                  <input type="number" step="0.01" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white text-xl sm:text-2xl font-mono" />
                </label>
              </div>
              <p className="text-sm text-gray-400 mt-3">Маржа: {Math.round((Number(sell) || 0) - (Number(cost) || 0))} с</p>
              <button type="button" onClick={savePrices} disabled={savingPrice} className="btn-primary mt-5 px-6 py-3 w-full sm:w-auto">{savingPrice ? 'Сохранение…' : 'Сохранить цену'}</button>
            </>
          )}
          {current && !isGeneral && (
            <>
              <p className="text-sm text-[#C8A77E] mb-4">Рецепт из ингредиентов склада.</p>
              <div className="space-y-2 mb-6">
                {lines.length === 0 && <p className="text-gray-400">Рецепта ещё нет</p>}
                {lines.map((l) => (
                  <div key={l.id || l.ingredient_id} className="flex items-center gap-2 sm:gap-3 bg-[#2C241E] rounded-2xl px-3 sm:px-4 py-3">
                    <span className="flex-1 text-white text-sm sm:text-base min-w-0 truncate">{l.name}</span>
                    {editId === l.id ? (
                      <>
                        <input type="number" step="0.001" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-20 sm:w-24 bg-[#3F2A1F] rounded-xl px-2 py-1 text-white" />
                        <button type="button" onClick={() => saveQty(l.id)} className="text-emerald-400">OK</button>
                      </>
                    ) : (
                      <button type="button" className="font-mono text-[#C8A77E] text-sm" onClick={() => { setEditId(l.id || null); setEditQty(l.quantity); }}>{l.quantity} {l.unit}</button>
                    )}
                    <button type="button" onClick={() => removeLine(l.id)} className="text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3 text-white">
                  <option value="">Ингредиент</option>
                  {ings.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" step="0.001" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-28 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3 text-white" />
                  <button type="button" onClick={addLine} className="btn-primary px-4">+</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#3F2A1F] rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-3 relative">
            <button type="button" onClick={() => setCreateOpen(false)} className="absolute right-4 top-4 text-gray-400"><X /></button>
            <h2 className="text-xl sm:text-2xl text-white pr-8">Новая техкарта</h2>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
            <select value={newZone} onChange={(e) => setNewZone(e.target.value as Zone)} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white">
              <option value="coffee">Кофейня</option>
              <option value="kitchen">Кухня</option>
              <option value="general">Общее</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-[#C8A77E]">Цена, с
                <input type="number" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
              </label>
              <label className="text-sm text-[#C8A77E]">Себестоимость, с
                <input type="number" step="0.01" value={newCost} onChange={(e) => setNewCost(Number(e.target.value))} className="mt-1 w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-4 py-3 text-white" />
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 py-3 rounded-2xl border border-[#5C4030] text-white">Отмена</button>
              <button type="button" onClick={createCard} disabled={creating} className="flex-1 btn-primary py-3">{creating ? 'Сохранение…' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
