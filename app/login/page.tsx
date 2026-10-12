'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      router.replace('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C241E] flex items-center justify-center p-4 sm:p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-[#3F2A1F] rounded-3xl p-6 sm:p-10 border border-[#5C4030] space-y-4">
        <p className="text-[#C8A77E] tracking-widest text-sm text-center">MA CHERIE</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-center">Вход в смену</h1>
        <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-5 py-4" />
        <input required type="password" autoComplete="current-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-5 py-4" />
        {error && <p className="text-amber-400 text-sm text-center">{error}</p>}
        <button disabled={loading} className="btn-primary w-full py-4">{loading ? '...' : 'Войти'}</button>
        <p className="text-xs text-[#C8A77E] text-center">Аккаунт создаёт админ. Открытая регистрация выключена.</p>
      </form>
    </div>
  );
}
