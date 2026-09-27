'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!ready) {
    return <p className="text-white text-center py-20">Проверка смены...</p>;
  }

  return <>{children}</>;
}
