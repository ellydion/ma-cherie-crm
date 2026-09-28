'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login');
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  if (!ready) return <p className="text-white text-center py-20">Проверка смены...</p>;
  return <>{children}</>;
}
