import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#2C241E]">
      {/* Боковое меню */}
      <Sidebar />

      {/* Основная область */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Шапка */}
        <Header />

        {/* Контент страницы */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}