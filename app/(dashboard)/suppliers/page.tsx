'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SuppliersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data }) => setRows(data || []));
  }, []);
  return (
    <div>
      <h1 className="text-4xl font-semibold mb-2">Поставщики</h1>
      <p className="text-[#C8A77E] mb-8">Поставка увеличивает общий склад</p>
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="card p-5">
            <p className="text-xl font-semibold">{s.name}</p>
            <p className="text-gray-400">{s.contact} · {s.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
