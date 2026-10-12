'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        router.replace('/login');
        return;
      }
      setReady(true);
    };

    check();
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setReady(false);
        router.replace('/login');
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) return <p className="text-white text-center py-20">Проверка смены...</p>;
  return <>{children}</>;
}
