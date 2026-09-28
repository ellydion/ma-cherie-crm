'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CustomersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('customers').select('*').order('name').then(({ data }) => setRows(data || []));
  }, []);
  return (
    <div>
      <h1 className="text-4xl font-semibold mb-8">Клиенты</h1>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead><tr className="text-left border-b border-[#5C4030]"><th className="p-5">Имя</th><th className="p-5">Телефон</th><th className="p-5">Уровень</th><th className="p-5">Сумма</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-[#5C4030]">
                <td className="p-5">{c.name}</td><td className="p-5">{c.phone}</td>
                <td className="p-5 text-[#C8A77E]">{c.loyalty_level}</td>
                <td className="p-5 font-mono">{c.total_spent} с</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
