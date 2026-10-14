'use client';

import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useShiftStore } from '@/lib/store/shiftStore';
import { useZone } from '@/lib/useZone';
import { productZone, zoneLabel } from '@/lib/zone';

type Product = { id: string; name: string; price: number; category: string; section?: string; track_stock?: boolean };
type Line = Product & { quantity: number };

const CATS = [
  ['all', 'Все'], ['coffee', 'Кофе'], ['nitro', 'Нитро'], ['asu', 'Асу'],
  ['kitchen', 'Кухня'], ['drinks', 'Напитки'], ['desserts', 'Десерты'],
] as const;

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [table, setTable] = useState('Стол 1');
  const [lines, setLines] = useState<Line[]>([]);
  const [loadError, setLoadError] = useState('');
  const currentShift = useShiftStore((s) => s.current);
  const refreshShift = useShiftStore((s) => s.refresh);
  const { zone } = useZone();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('products').select('id, name, price, category, section, track_stock').order('name');
      if (error) { setLoadError(error.message); setProducts([]); return; }
      setLoadError('');
      setProducts(data || []);
    };
    load();
    refreshShift();
    supabase.from('customers').select('id, name, loyalty_level, points, total_spent').order('name').then(({ data }) => setCustomers(data || []));
  }, [refreshShift]);

  const zoneProducts = products.filter((p) => zone === 'all' || productZone(p) === zone);
  const list = zoneProducts.filter((p) => (cat === 'all' || p.category === cat) && p.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const guest = customers.find((c) => c.id === customerId);
  const discountPct = guest?.loyalty_level === 'Platinum' ? 15 : guest?.loyalty_level === 'Gold' ? 10 : guest?.loyalty_level === 'Silver' ? 5 : 0;
  const discount = Math.round(subtotal * discountPct / 100);
  const total = Math.max(0, subtotal - discount);

  const add = (p: Product) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === p.id);
      if (found) return prev.map((l) => (l.id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const writeOff = async (line: Line) => {
    const { data: recipe } = await supabase.from('product_ingredients').select('ingredient_id, quantity').eq('product_id', line.id);
    if (recipe && recipe.length) {
      for (const r of recipe) {
        const qty = Number(r.quantity) * line.quantity;
        const { error } = await supabase.rpc('decrement_ingredient_quantity', { ingredient_id: r.ingredient_id, qty });
        if (error) {
          const { data: ing } = await supabase.from('ingredients').select('quantity').eq('id', r.ingredient_id).maybeSingle();
          if (ing) await supabase.from('ingredients').update({ quantity: Math.max(0, Number(ing.quantity) - qty) }).eq('id', r.ingredient_id);
        }
      }
      return;
    }
    const { data: product } = await supabase.from('products').select('quantity, track_stock').eq('id', line.id).maybeSingle();
    if (product?.track_stock) {
      await supabase.from('products').update({ quantity: Math.max(0, Number(product.quantity) - line.quantity) }).eq('id', line.id);
    }
  };

  const close = async (method: 'cash' | 'transfer') => {
    if (!lines.length) return;
    const payload: any = {
      table_number: table, total, payment_method: method, status: 'completed',
      comment: guest ? `${guest.name} ${guest.loyalty_level} -${discountPct}%` : null,
    };
    if (currentShift?.id) payload.shift_id = currentShift.id;
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user?.id) payload.cashier_id = auth.user.id;
    let { data: order, error } = await supabase.from('orders').insert([payload]).select().single();
    if (error && payload.shift_id) {
      delete payload.shift_id;
      const retry = await supabase.from('orders').insert([payload]).select().single();
      order = retry.data;
      error = retry.error;
    }
    if (error || !order) { alert('Не удалось сохранить заказ'); return; }
    await supabase.from('order_items').insert(lines.map((l) => ({ order_id: order.id, product_id: l.id, product_name: l.name, quantity: l.quantity, price: l.price })));
    for (const line of lines) await writeOff(line);
    if (guest) {
      await supabase.from('customers').update({
        total_spent: Number(guest.total_spent || 0) + total,
        points: Number(guest.points || 0) + Math.round(total / 10),
      }).eq('id', guest.id);
    }
    setLines([]);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {loadError && <p className="text-red-400 mb-3 text-sm">Ошибка меню: {loadError}</p>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">Касса · {zoneLabel(zone)}</h1>
          <p className="text-[#C8A77E] text-sm">{zone === 'all' ? 'Все товары' : `Только ${zoneLabel(zone).toLowerCase()}`}</p>
        </div>
        <input value={table} onChange={(e) => setTable(e.target.value)} className="bg-[#3F2A1F] border border-[#5C4030] rounded-2xl px-4 py-3 w-full sm:w-40" />
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {CATS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setCat(id)} className={`px-4 py-2 rounded-2xl text-sm ${cat === id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#3F2A1F]'}`}>{label}</button>
        ))}
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск товара" className="bg-[#3F2A1F] border border-[#5C4030] rounded-2xl px-4 py-3 mb-4 w-full" />
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 overflow-auto content-start min-h-[40vh] lg:min-h-0">
          {list.map((p) => (
            <button key={p.id} onClick={() => add(p)} className="card p-3 sm:p-4 min-h-[6.5rem] text-left hover:scale-[1.02]">
              <p className="font-medium text-sm sm:text-base line-clamp-2">{p.name}</p>
              <p className="text-[#C8A77E] text-xl sm:text-2xl font-mono mt-2">{p.price}</p>
            </button>
          ))}
          {list.length === 0 && <p className="text-gray-400 col-span-full">В этой зоне товаров нет</p>}
        </div>
        <div className="w-full lg:w-96 card p-4 sm:p-5 flex flex-col shrink-0 max-h-[55vh] lg:max-h-none">
          <h2 className="text-lg sm:text-xl mb-3 truncate">{table}</h2>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mb-3 bg-[#2C241E] border border-[#5C4030] rounded-2xl px-3 py-3 w-full">
            <option value="">Без карты лояльности</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.loyalty_level}</option>)}
          </select>
          <div className="flex-1 overflow-auto space-y-2 min-h-[8rem]">
            {lines.length === 0 && <p className="text-gray-400">Добавь товары</p>}
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 bg-[#2C241E] rounded-2xl px-3 py-3">
                <span className="flex-1 text-sm sm:text-base truncate">{l.name}</span>
                <button type="button" onClick={() => setLines((p) => p.map((x) => x.id === l.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x))}><Minus className="w-4 h-4" /></button>
                <span className="w-6 text-center">{l.quantity}</span>
                <button type="button" onClick={() => add(l)}><Plus className="w-4 h-4" /></button>
                <button type="button" onClick={() => setLines((p) => p.filter((x) => x.id !== l.id))} className="ml-1 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="my-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Сумма</span><span className="font-mono">{subtotal} с</span></div>
            {discountPct > 0 && <div className="flex justify-between text-[#C8A77E]"><span>Скидка {guest?.loyalty_level} {discountPct}%</span><span className="font-mono">-{discount} с</span></div>}
          </div>
          <p className="text-2xl sm:text-3xl font-semibold mb-4">Итого {total} с</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => close('cash')} disabled={!lines.length} className="py-4 rounded-2xl bg-emerald-600 disabled:bg-gray-600">Наличка</button>
            <button type="button" onClick={() => close('transfer')} disabled={!lines.length} className="py-4 rounded-2xl bg-blue-600 disabled:bg-gray-600">Перевод</button>
          </div>
        </div>
      </div>
    </div>
  );
}
