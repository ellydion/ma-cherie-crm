'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useProfileStore } from '@/lib/store/profileStore';
import {
  LayoutDashboard, Receipt, Coffee, Leaf, Package, BookOpen,
  Users, Truck, BarChart3, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Касса', href: '/pos', icon: Receipt },
  { name: 'Товары', href: '/products', icon: Coffee },
  { name: 'Ингредиенты', href: '/ingredients', icon: Leaf },
  { name: 'Склад', href: '/inventory', icon: Package },
  { name: 'Техкарты', href: '/techcards', icon: BookOpen },
  { name: 'Клиенты', href: '/customers', icon: Users },
  { name: 'Поставщики', href: '/suppliers', icon: Truck },
  { name: 'Отчёты', href: '/reports', icon: BarChart3 },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, fetchProfile, signOut } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="w-72 h-screen bg-[#3F2A1F] border-r border-[#5C4030] flex flex-col">
      <div className="p-6 border-b border-[#5C4030]">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/ma-cherie-logo.jpg" alt="Ma Cherie" width={56} height={56} className="object-contain rounded-2xl" />
          <div>
            <h1 className="text-2xl font-semibold text-white">Ma Cherie</h1>
            <p className="text-xs text-[#C8A77E] tracking-widest">COFFEE & MORE</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-3 rounded-3xl font-medium ${
                active ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#5C4030]">
        <div className="flex items-center gap-4 bg-[#2C241E] rounded-3xl p-4">
          <div className="w-12 h-12 bg-[#C8A77E] rounded-2xl flex items-center justify-center text-3xl">
            {profile?.avatar || '👨‍🍳'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{profile?.name || 'Сотрудник'}</p>
            <p className="text-xs text-[#C8A77E] truncate">{profile?.position || 'Смена'}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-3xl text-sm hover:bg-[#5C4030]">
          <LogOut className="w-4 h-4" /> Выйти
        </button>
      </div>
    </div>
  );
}
