import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AuthGate from '@/components/layout/AuthGate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex h-screen bg-[#2C241E]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
