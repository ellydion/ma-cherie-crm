'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function NotificationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);
  return (
    <div>
      <h1 className="text-4xl font-semibold mb-8">Уведомления</h1>
      <div className="space-y-3">
        {rows.map((n) => (
          <div key={n.id} className="card p-5">
            <p className="font-semibold">{n.title}</p>
            <p className="text-gray-400">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
