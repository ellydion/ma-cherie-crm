'use client';

import { useEffect } from 'react';
import { Bell, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import { useProfileStore } from '@/lib/store/profileStore';
import { useUiStore } from '@/lib/store/uiStore';
import { useShiftStore } from '@/lib/store/shiftStore';

export default function Header() {
  const { profile } = useProfileStore();
  const { toggleSidebar } = useUiStore();
  const { current, refresh } = useShiftStore();

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <header className="h-14 shrink-0 border-b border-[#5C4030] bg-[#3F2A1F] px-3 sm:px-5 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#5C4030] hover:bg-[#C8A77E] hover:text-[#3F2A1F]"
          aria-label="Меню"
        >
          <PanelLeft className="w-6 h-6" />
        </button>
        <Link href="/shifts" className={`text-sm truncate px-3 py-1 rounded-2xl ${current ? 'bg-emerald-700 text-white' : 'text-[#C8A77E]'}`}>
          {current ? 'Смена открыта' : 'Смена закрыта'}
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/notifications" className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-[#5C4030]">
          <Bell className="w-5 h-5" />
        </Link>
        <div className="text-right pl-3 border-l border-[#5C4030] hidden sm:block">
          <p className="text-sm font-semibold truncate max-w-[140px]">{profile?.name || 'Сотрудник'}</p>
          <p className="text-xs text-[#C8A77E]">{profile?.position || 'Смена'}</p>
        </div>
      </div>
    </header>
  );
}
