'use client';

import { ReactNode } from 'react';
import { Plus } from 'lucide-react';

export default function ProductsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Товары / Меню</h1>
          <p className="text-[#C8A77E] mt-1">Управление ассортиментом кофейни</p>
        </div>

        <button 
          onClick={() => window.location.href = '/products'}
          className="btn-primary flex items-center gap-3 px-8 py-4 text-lg"
        >
          <Plus className="w-6 h-6" />
          Добавить товар
        </button>
      </div>

      {children}
    </div>
  );
}