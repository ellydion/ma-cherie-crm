'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Row = { id: string; name: string; unit: string; quantity: number; min_threshold: number; section: string; kind?: string };

const CATS = [
  { id: 'all', label: 'Все' },
  { id: 'coffee', label: 'Кофейня' },
  { id: 'kitchen', label: 'Кухня' },
  { id: 'ingredient', label: 'Ингредиенты' },
  { id: 'product', label: 'Готовые товары' },
];

const ADMIN = 'admin@macherie.coffee';

export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [msg, setMsg] = useState('');

  const isAdmin = email.toLowerCase() === ADMIN;

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    setEmail(auth.user?.email || '');
    const { data: view } = await supabase.from('warehouse_stock').select('*').order('name');
    if (view && view.length) { setRows(view as Row[]); return; }
    const { data: ings } = await supabase.from('ingredients').select('*').order('name');
    setRows((ings || []).map((i: any) => ({ ...i, kind: 'ingredient' })));
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (cat === 'coffee' || cat === 'kitchen') { if (r.section !== cat) return false; }
    else if (cat === 'ingredient' || cat === 'product') { if ((r.kind || 'ingredient') !== cat) return false; }
    return r.name.toLowerCase().includes(search.toLowerCase());
  });

  const status = (q: number, min: number) => {
    if (q <= 0) return { t: 'Нет', c: 'bg-red-600' };
    if (q < min) return { t: 'Мало', c: 'bg-amber-600' };
    return { t: 'Ок', c: 'bg-emerald-600' };
  };

  const saveQty = async (row: Row) => {
    if (!isAdmin) {
      setMsg('Менять остаток может только admin@macherie.coffee');
      return;
    }
    const table = row.kind === 'product' ? 'products' : 'ingredients';
    const { error } = await supabase.from(table).update({ quantity: editQty }).eq('id', row.id);
    if (error) setMsg(error.message);
    else {
      setEditId(null);
      setMsg('');
      load();
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-semibold">Склад</h1>
      <p className="text-[#C8A77E] mb-2">Общее место остатков</p>
      {isAdmin
        ? <p className="text-emerald-400 text-sm mb-4">Админ: нажми на количество, чтобы изменить</p>
        : <p className="text-gray-400 text-sm mb-4">Количество меняет только admin@macherie.coffee</p>}
      {msg && <p className="text-amber-400 mb-3">{msg}</p>}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-5 py-3 rounded-3xl ${cat === c.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#3F2A1F]'}`}>{c.label}</button>
        ))}
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск" className="w-full bg-[#3F2A1F] border border-[#5C4030] rounded-3xl px-6 py-4 mb-6" />
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="text-left border-b border-[#5C4030]"><th className="p-5">Позиция</th><th className="p-5">Тип</th><th className="p-5">Секция</th><th className="p-5">Остаток</th><th className="p-5">Статус</th></tr></thead>
          <tbody>
            {filtered.map((r) => {
              const s = status(Number(r.quantity), Number(r.min_threshold));
              return (
                <tr key={`${r.kind}-${r.id}`} className="border-t border-[#5C4030]">
                  <td className="p-5">{r.name}</td>
                  <td className="p-5 text-[#C8A77E]">{r.kind === 'product' ? 'Готовый товар' : 'Ингредиент'}</td>
                  <td className="p-5">{r.section === 'kitchen' ? 'Кухня' : 'Кофейня'}</td>
                  <td className="p-5">
                    {isAdmin && editId === r.id ? (
                      <span className="flex items-center gap-2">
                        <input type="number" step="0.01" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-24 bg-[#2C241E] rounded-xl px-3 py-2" />
                        <button type="button" onClick={() => saveQty(r)} className="text-emerald-400">OK</button>
                        <button type="button" onClick={() => setEditId(null)} className="text-gray-400">×</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={`font-mono ${isAdmin ? 'underline decoration-[#C8A77E]' : ''}`}
                        onClick={() => {
                          if (!isAdmin) { setMsg('Менять остаток может только admin@macherie.coffee'); return; }
                          setEditId(r.id);
                          setEditQty(Number(r.quantity));
                        }}
                      >
                        {r.quantity} {r.unit}
                      </button>
                    )}
                  </td>
                  <td className="p-5"><span className={`px-4 py-1 rounded-3xl text-sm ${s.c}`}>{s.t}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
