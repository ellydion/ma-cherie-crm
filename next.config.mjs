/** @type {import('next').NextConfig} */
const nextConfig = {
  // === Основные настройки ===
  reactStrictMode: true,
  poweredByHeader: false,           // Убирает X-Powered-By заголовок
  compress: true,                   // Включает gzip/brotli сжатие

  // === Оптимизация изображений ===
  images: {
    remotePatterns: [
      // Можно добавить внешние домены позже, если понадобится
      // { protocol: 'https', hostname: 'example.com' },
    ],
    // Локальные изображения из /public работают автоматически
  },

  // === Оптимизация сборки и скорости ===
  experimental: {
    optimizePackageImports: [
      'lucide-react',           // Иконки
      '@supabase/supabase-js',  // Supabase клиент
    ],
  },

  // === Turbopack (для разработки) ===
  turbopack: {
    // Можно добавить правила при необходимости
  },

  // === Для продакшена (рекомендуется для Vercel) ===
  // output: 'standalone',

  // === Дополнительные оптимизации ===
  // eslint: {
  //   ignoreDuringBuilds: true, // Раскомментировать, если есть ошибки ESLint
  // },
};

export default nextConfig;