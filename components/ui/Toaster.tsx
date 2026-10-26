'use client';

import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/lib/store/toastStore';

const styles = {
  success: 'bg-emerald-800 border-emerald-500 text-white',
  error: 'bg-red-900 border-red-500 text-red-50',
  info: 'bg-[#3F2A1F] border-[#C8A77E] text-white',
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="fixed z-[100] top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md space-y-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl ${styles[t.kind]}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 text-sm sm:text-base break-words">{t.text}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="shrink-0 opacity-80 hover:opacity-100" aria-label="Закрыть уведомление">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
