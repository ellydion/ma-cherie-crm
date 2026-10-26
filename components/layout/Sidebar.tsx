'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useProfileStore } from '@/lib/store/profileStore';
import { useUiStore } from '@/lib/store/uiStore';
import { useZoneViewStore } from '@/lib/store/zoneViewStore';
import { Zone, zoneLabel } from '@/lib/zone';
import { useSettings } from '@/lib/store/settingsStore';
import {
  LayoutDashboard, Receipt, Coffee, Leaf, Package, BookOpen,
  Users, Truck, BarChart3, Settings, LogOut, X, Clock,
} from 'lucide-react';

const navItems = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Касса', href: '/pos', icon: Receipt },
  { name: 'Смены', href: '/shifts', icon: Clock },
  { name: 'Товары', href: '/products', icon: Coffee },
  { name: 'Ингредиенты', href: '/ingredients', icon: Leaf },
  { name: 'Склад', href: '/inventory', icon: Package },
  { name: 'Техкарты', href: '/techcards', icon: BookOpen },
  { name: 'Клиенты', href: '/customers', icon: Users },
  { name: 'Поставщики', href: '/suppliers', icon: Truck },
  { name: 'Отчёты', href: '/reports', icon: BarChart3 },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

const VIEWS: { id: Zone; label: string }[] = [
  { id: 'all', label: 'Всё' },
  { id: 'coffee', label: 'Кофейня' },
  { id: 'kitchen', label: 'Кухня' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, fetchProfile, signOut } = useProfileStore();
  const { sidebarOpen, setSidebar } = useUiStore();
  const companyName = useSettings().company.name;
  const view = useZoneViewStore((s) => s.view);
  const setView = useZoneViewStore((s) => s.setView);
  const isAdmin = (profile?.email || '').toLowerCase() === 'admin@macherie.coffee' || profile?.role === 'admin';
  const zone = !isAdmin && profile?.zone && profile.zone !== 'all' ? profile.zone : view;

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setSidebar(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [setSidebar]);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebar(false);
  }, [pathname, setSidebar]);

  return (
    <>
      {sidebarOpen && (
        <button type="button" aria-label="Закрыть меню" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebar(false)} />
      )}

      <aside className={`fixed z-50 top-0 left-0 h-screen w-72 max-w-[85vw] bg-[#3F2A1F] border-r border-[#5C4030] flex flex-col transition-transform duration-200 lg:relative lg:z-auto lg:shrink-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}>
        <div className="p-4 sm:p-5 border-b border-[#5C4030] flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-3 min-w-0" onClick={() => window.innerWidth < 1024 && setSidebar(false)}>
            <Image src="/ma-cherie-logo.jpg" alt="Ma Cherie" width={44} height={44} className="object-contain rounded-2xl shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-white truncate">{companyName}</h1>
              <p className="text-[10px] text-[#C8A77E] tracking-widest">{zoneLabel(zone).toUpperCase()}</p>
            </div>
          </Link>
          <button type="button" onClick={() => setSidebar(false)} className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-[#5C4030] shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isAdmin && (
          <div className="px-3 pt-3 grid grid-cols-3 gap-1">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" onClick={() => setView(v.id)} className={`px-2 py-2 rounded-2xl text-xs font-semibold ${view === v.id ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'bg-[#2C241E] text-white'}`}>
                {v.label}
              </button>
            ))}
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => { if (window.innerWidth < 1024) setSidebar(false); }} className={`flex items-center gap-4 px-4 py-3 rounded-3xl font-medium ${active ? 'bg-[#C8A77E] text-[#3F2A1F]' : 'text-white hover:bg-[#5C4030]'}`}>
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#5C4030]">
          <div className="flex items-center gap-3 bg-[#2C241E] rounded-3xl p-3">
            <div className="w-11 h-11 bg-[#C8A77E] rounded-2xl flex items-center justify-center text-2xl shrink-0">{profile?.avatar || '👨‍🍳'}</div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{profile?.name || 'Сотрудник'}</p>
              <p className="text-xs text-[#C8A77E] truncate">{isAdmin ? 'Админ · ' : ''}{zoneLabel(zone)}</p>
            </div>
          </div>
          <button type="button" onClick={() => signOut()} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-3xl text-sm hover:bg-[#5C4030]">
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
