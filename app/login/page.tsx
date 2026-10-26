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
      const text = err instanceof Error ? err.message : '';
      if (/invalid login credentials/i.test(text)) setError('Неверный email или пароль');
      else if (/failed to fetch|network/i.test(text)) setError('Нет связи с сервером. Проверь интернет и попробуй ещё раз.');
      else setError(text || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C241E] flex items-center justify-center p-4 sm:p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-[#3F2A1F] rounded-3xl p-6 sm:p-10 border border-[#5C4030] space-y-4">
        <p className="text-[#C8A77E] tracking-widest text-sm text-center">MA CHERIE</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-center">Вход в смену</h1>
        <div className="space-y-1">
          <label htmlFor="login-email" className="block text-sm text-[#C8A77E]">Email</label>
          <input id="login-email" name="email" required type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@macherie.coffee" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-5 py-4" />
        </div>
        <div className="space-y-1">
          <label htmlFor="login-password" className="block text-sm text-[#C8A77E]">Пароль</label>
          <input id="login-password" name="password" required type="password" autoComplete="current-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#2C241E] border border-[#5C4030] rounded-2xl px-5 py-4" />
        </div>
        {error && <p role="alert" className="text-amber-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-4 disabled:opacity-60">{loading ? 'Входим…' : 'Войти'}</button>
        <p className="text-xs text-[#C8A77E] text-center">Аккаунт создаёт админ. Открытая регистрация выключена.</p>
      </form>
    </div>
  );
}
