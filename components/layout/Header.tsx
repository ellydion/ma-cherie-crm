'use client';

import { Moon, Sun, Bell } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 border-b border-[#5C4030] bg-[#3F2A1F] px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold text-white">Дашборд</h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => window.location.href = '/notifications'}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[#5C4030] transition-all"
        >
          <Bell className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[#5C4030] transition-all"
        >
          {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#5C4030]">
          <div className="text-right">
            <p className="font-semibold text-white text-sm">Лена</p>
            <p className="text-xs text-[#C8A77E]">Администратор / Бариста</p>
          </div>
          <div className="w-9 h-9 bg-[#C8A77E] rounded-2xl flex items-center justify-center text-2xl">
            👩‍🍳
          </div>
        </div>
      </div>
    </header>
  );
}