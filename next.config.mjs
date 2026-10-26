/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';
const isPreview = process.env.VERCEL_ENV === 'preview';

// Адрес Supabase из переменных (на случай своего домена), плюс все проекты *.supabase.co.
function supabaseOrigins() {
  const list = ['https://*.supabase.co', 'wss://*.supabase.co'];
  try {
    const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (raw) {
      const u = new URL(raw);
      list.push(u.origin, `${u.protocol === 'http:' ? 'ws' : 'wss'}://${u.host}`);
    }
  } catch {
    // пустая или кривая переменная: оставляем только *.supabase.co
  }
  return [...new Set(list)];
}

// Панель Vercel (комментарии/тулбар) показывается только на preview-деплоях.
const vercelLive = isPreview ? ['https://vercel.live'] : [];

const csp = [
  "default-src 'self'",
  // Next.js без nonce вставляет inline-скрипты гидрации, поэтому 'unsafe-inline' обязателен.
  // 'unsafe-eval' нужен только dev-серверу (React Refresh).
  ["script-src 'self' 'unsafe-inline'", isDev ? "'unsafe-eval'" : '', ...vercelLive].filter(Boolean).join(' '),
  ["style-src 'self' 'unsafe-inline'", ...vercelLive].join(' '),
  ["img-src 'self' data: blob: https://*.supabase.co", ...(isPreview ? ['https://vercel.live', 'https://vercel.com'] : [])].join(' '),
  ["font-src 'self' data:", ...(isPreview ? ['https://vercel.live', 'https://assets.vercel.com'] : [])].join(' '),
  ["connect-src 'self'", ...supabaseOrigins(), ...(isPreview ? ['https://vercel.live', 'wss://ws-us3.pusher.com'] : []), ...(isDev ? ['ws:'] : [])].join(' '),
  ['frame-src', ...(isPreview ? ['https://vercel.live'] : ["'none'"])].join(' '),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

// CSP_REPORT_ONLY=1 в переменных Vercel переводит политику в режим «только отчёт»,
// если после выкладки что-то перестанет грузиться. Тогда нарушения видны в консоли браузера.
const cspHeaderName = process.env.CSP_REPORT_ONLY === '1' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';

const appOrigin = process.env.APP_ORIGIN || 'https://app.macherie.coffee';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: cspHeaderName, value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          // Своих API-роутов в приложении нет, данные идут напрямую в Supabase.
          // "*" ставит CDN Vercel по умолчанию для статики; сужаем до своего домена.
          { key: 'Access-Control-Allow-Origin', value: appOrigin },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
