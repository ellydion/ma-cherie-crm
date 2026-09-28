'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [buy, setBuy] = useState(0);

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    supabase.from('orders').select('*').gte('created_at', from.toISOString()).then(({ data }) => setOrders(data || []));
    supabase.from('deliveries').select('total_amount').gte('delivery_date', from.toISOString().slice(0, 10)).then(({ data }) => {
      setBuy((data || []).reduce((s: number, d: any) => s + Number(d.total_amount), 0));
    });
  }, []);

  const sales = orders.reduce((s, o) => s + Number(o.total), 0);
  const cash = orders.filter((o) => o.payment_method === 'cash').reduce((s, o) => s + Number(o.total), 0);
  const transfer = orders.filter((o) => o.payment_method === 'transfer').reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <h1 className="text-4xl font-semibold mb-8">Отчёты за 7 дней</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-6"><p className="text-[#C8A77E]">Продажи</p><p className="text-3xl font-mono">{sales} с</p></div>
        <div className="card p-6"><p className="text-[#C8A77E]">Закуп</p><p className="text-3xl font-mono">{buy} с</p></div>
        <div className="card p-6"><p className="text-emerald-400">Наличка</p><p className="text-3xl font-mono">{cash} с</p></div>
        <div className="card p-6"><p className="text-blue-400">Перевод</p><p className="text-3xl font-mono">{transfer} с</p></div>
      </div>
    </div>
  );
}
