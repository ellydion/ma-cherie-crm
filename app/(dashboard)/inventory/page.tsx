'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Row = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_threshold: number;
  section: string;
  kind?: string;
};

export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data: view } = await supabase.from('warehouse_stock').select('*').order('name');
    if (view && view.length) {
      setRows(view as Row[]);
      return;
    }
    const { data: ings } = await supabase.from('ingredients').select('*').order('name');
    if (ings && ings.length) {
      setRows(ings.map((i: any) => ({ ...i, kind: 'ingredient' })));
      return;
    }
    const { data: old } = await supabase.from('products').select('*').eq('is_ingredient', true).order('name');
    setRows((old || []).map((i: any) => ({ ...i, kind: 'ingredient' })));
  };

  useEffect(() => { load(); }, []);

  const status = (q: number, min: number) => {
    if (q <= 0) return { t: 'Нет', c: 'bg-red-600' };
    if (q < min) return { t: 'Мало', c: 'bg-amber-600' };
    return { t: 'Ок', c: 'bg-emerald-600' };
  };

  return (
    <div>
      <h1 className="text-4xl font-semibold">Склад</h1>
      <p className="text-[#C8A77E] mb-8">Общее место: ингредиенты и готовые товары с учётом остатка</p>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-[#5C4030]">
              <th className="p-5">Позиция</th>
              <th className="p-5">Тип</th>
              <th className="p-5">Остаток</th>
              <th className="p-5">Мин.</th>
              <th className="p-5">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = status(Number(r.quantity), Number(r.min_threshold));
              return (
                <tr key={r.id} className="border-t border-[#5C4030]">
                  <td className="p-5">{r.name}</td>
                  <td className="p-5 text-[#C8A77E]">{r.kind === 'product' ? 'Готовый товар' : 'Ингредиент'}</td>
                  <td className="p-5 font-mono text-2xl">{r.quantity} {r.unit}</td>
                  <td className="p-5 text-gray-400">{r.min_threshold}</td>
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
