import type { Metadata, Viewport } from 'next';
import Toaster from '@/components/ui/Toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ma Cherie CRM',
  description: 'Касса, склад и продажи кофейни',
  // Внутренняя CRM: не индексировать и не ходить по ссылкам.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2C241E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-[#2C241E] text-white antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
