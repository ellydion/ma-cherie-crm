import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Ma Cherie CRM",
  description: "Система управления кофейней",
  icons: {
    icon: "/ma-cherie-logo.jpg",
    apple: "/ma-cherie-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="bg-[#2C241E] text-white antialiased">
        {children}
      </body>
    </html>
  );
}