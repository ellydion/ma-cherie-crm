'use client';

import { Moon, Sun, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProfileStore } from '@/lib/store/profileStore';

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();

    // Тёмная тема
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(isDarkMode);
    if (isDarkMode) document.documentElement.classList.add('dark');
  }, [fetchProfile]);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="h-16 border-b border-[#5C4030] bg-[#3F2A1F] px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold text-white">Дашборд</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Уведомления */}
        <button
          onClick={() => window.location.href = '/notifications'}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[#5C4030] transition-all relative"
        >
          <Bell className="w-6 h-6 text-white" />
        </button>

        {/* Переключатель темы */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[#5C4030] transition-all"
        >
          {isDark ? <Sun className="w-6 h-6 text-white" /> : <Moon className="w-6 h-6 text-white" />}
        </button>

        {/* Профиль сотрудника */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold text-white text-sm">
              {profile?.name || 'Загрузка...'}
            </p>
            <p className="text-xs text-[#C8A77E]">{profile?.position || ''}</p>
          </div>
          <div className="w-9 h-9 bg-[#C8A77E] rounded-2xl flex items-center justify-center text-2xl">
            {profile?.avatar || '👨‍🍳'}
          </div>
        </div>
      </div>
    </header>
  );
}