import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Ma Cherie CRM',
  description: 'Кастомная CRM для Ma Cherie Coffee & More',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#2C241E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#2C241E] text-[#F5F0E8]`}>
        {children}
      </body>
    </html>
  );
}