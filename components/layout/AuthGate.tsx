'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

// Ключ, под которым supabase-js хранит сессию: sb-<ref>-auth-token.
const storageKey = (() => {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').hostname;
    return `sb-${host.split('.')[0]}-auth-token`;
  } catch {
    return 'sb-placeholder-auth-token';
  }
})();

const noop = () => () => {};
/** Есть ли сохранённая сессия. Синхронно, без сети. */
const hasStoredSession = () => {
  try { return !!window.localStorage.getItem(storageKey); } catch { return true; }
};

/**
 * Пускает в кабинет без заглушки: если в браузере есть сохранённая сессия, страница
 * рисуется сразу, а проверка getSession идёт в фоне. Нет сессии или она недействительна:
 * уводим на /login. Данные при этом всё равно защищены RLS в базе.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // На сервере и при гидрации считаем, что сессия есть (оптимистично), на клиенте читаем localStorage.
  const stored = useSyncExternalStore(noop, hasStoredSession, () => true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!stored) { router.replace('/login'); return; }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) { setDenied(true); router.replace('/login'); }
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setDenied(true);
        router.replace('/login');
        return;
      }
      if (session) setDenied(false);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [router, stored]);

  if (!stored || denied) return null;
  return <>{children}</>;
}
