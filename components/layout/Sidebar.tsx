'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Coffee, 
  Receipt, 
  Package, 
  Users, 
  Truck, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Касса (POS)', href: '/pos', icon: Receipt },
  { name: 'Склад', href: '/inventory', icon: Package },
  { name: 'Товары', href: '/products', icon: Coffee },
  { name: 'Клиенты', href: '/customers', icon: Users },
  { name: 'Поставщики', href: '/suppliers', icon: Truck },
  { name: 'Отчёты', href: '/reports', icon: BarChart3 },
  { name: 'Техкарты', href: '/techcards', icon: Coffee },
  { name: 'Настройки', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 h-screen bg-[#3F2A1F] border-r border-[#5C4030] flex flex-col shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-[#5C4030]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#C8A77E] rounded-3xl flex items-center justify-center text-4xl shadow-inner">
            ☕
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tighter text-white">
              Ma Cherie
            </h1>
            <p className="text-sm text-[#C8A77E] tracking-widest -mt-1">COFFEE & MORE</p>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-6 py-4 rounded-3xl font-medium transition-all group",
                isActive 
                  ? "bg-[#C8A77E] text-[#3F2A1F] shadow-inner" 
                  : "text-white hover:bg-[#5C4030] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Нижняя часть */}
      <div className="p-6 border-t border-[#5C4030]">
        <div className="flex items-center gap-4 bg-[#2C241E] rounded-3xl p-4">
          <div className="w-10 h-10 bg-[#C8A77E] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
            👨‍🍳
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">Айбек Султанов</p>
            <p className="text-xs text-[#C8A77E]">Администратор</p>
          </div>
        </div>
      </div>
    </div>
  );
}