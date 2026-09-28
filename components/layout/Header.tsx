'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useProfileStore } from '@/lib/store/profileStore';

export default function Header() {
  const { profile } = useProfileStore();
  return (
    <header className="h-16 border-b border-[#5C4030] bg-[#3F2A1F] px-8 flex items-center justify-between">
      <p className="text-[#C8A77E] text-sm">Общая база · все кассы видят одни продажи</p>
      <div className="flex items-center gap-3">
        <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-[#5C4030]">
          <Bell className="w-5 h-5" />
        </Link>
        <div className="text-right pl-4 border-l border-[#5C4030]">
          <p className="text-sm font-semibold">{profile?.name || 'Сотрудник'}</p>
          <p className="text-xs text-[#C8A77E]">{profile?.position || 'Смена'}</p>
        </div>
      </div>
    </header>
  );
}
