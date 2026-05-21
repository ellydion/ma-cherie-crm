'use client';

import { Moon, Sun, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Тёмная тема
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(isDarkMode);
    if (isDarkMode) document.documentElement.classList.add('dark');

    // Количество уведомлений
    const updateUnreadCount = () => {
      const saved = localStorage.getItem('ma-cherie-notifications');
      if (saved) {
        const notifs = JSON.parse(saved);
        const unread = notifs.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    };

    updateUnreadCount();
    window.addEventListener('storage', updateUnreadCount);
    return () => window.removeEventListener('storage', updateUnreadCount);
  }, []);

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
          title="Уведомления"
        >
          <Bell className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Переключатель темы */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[#5C4030] transition-all"
          title="Переключить тему"
        >
          {isDark ? <Sun className="w-6 h-6 text-white" /> : <Moon className="w-6 h-6 text-white" />}
        </button>

        {/* Пользователь */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold text-white text-sm">Айбек Султанов</p>
            <p className="text-xs text-[#C8A77E]">Администратор</p>
          </div>
          <div className="w-9 h-9 bg-[#C8A77E] rounded-2xl flex items-center justify-center text-2xl text-[#3F2A1F]">
            👨‍🍳
          </div>
        </div>
      </div>
    </header>
  );
}