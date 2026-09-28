'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, position: 'Бариста', role: 'staff' } },
        });
        if (err) throw err;
        setError('Аккаунт создан. Теперь войди.');
        setMode('login');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.replace('/');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C241E] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-[#3F2A1F] rounded-3xl p-10 border border-[#5C4030] space-y-4">
        <p className="text-[#C8A77E] tracking-widest text-sm text-center">MA CHERIE</p>
        <h1 className="text-3xl font-semibold text-center">{mode === 'login' ? 'Вход в смену' : 'Новый сотрудник'}</h1>
        {mode === 'signup' && (
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4" />
        )}
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4" />
        <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4" />
        {error && <p className="text-amber-400 text-sm text-center">{error}</p>}
        <button disabled={loading} className="btn-primary w-full py-4">{loading ? '...' : mode === 'login' ? 'Войти' : 'Создать'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full text-[#C8A77E] text-sm">
          {mode === 'login' ? 'Зарегистрировать сотрудника' : 'Уже есть аккаунт'}
        </button>
      </form>
    </div>
  );
}
