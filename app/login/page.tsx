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
          options: {
            data: { name, position: 'Barista', role: 'staff' },
          },
        });
        if (err) throw err;
        setError('Аккаунт создан. Если почту не просят подтвердить — сразу войди.');
        setMode('login');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.replace('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка входа';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C241E] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#3F2A1F] rounded-3xl p-10 border border-[#5C4030]">
        <div className="text-center mb-8">
          <p className="text-[#C8A77E] tracking-widest text-sm">MA CHERIE</p>
          <h1 className="text-3xl font-semibold text-white mt-2">
            {mode === 'login' ? 'Вход в смену' : 'Новый сотрудник'}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Email и пароль. Студенты входят так же.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
          />
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (мин. 6 символов)"
            className="w-full bg-[#2C241E] border border-[#5C4030] rounded-3xl px-6 py-4 text-white"
          />

          {error && <p className="text-amber-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-3xl bg-[#C8A77E] text-[#3F2A1F] font-semibold disabled:opacity-60"
          >
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
          className="w-full mt-6 text-[#C8A77E] text-sm"
        >
          {mode === 'login' ? 'Нет аккаунта — зарегистрировать' : 'Уже есть аккаунт — войти'}
        </button>
      </div>
    </div>
  );
}
