import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ma Cherie CRM',
  description: 'Касса, склад и продажи кофейни',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-[#2C241E] text-white antialiased">{children}</body>
    </html>
  );
}
