import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = { id: number; kind: ToastKind; text: string };

interface ToastStore {
  toasts: Toast[];
  push: (kind: ToastKind, text: string, ms?: number) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  push: (kind, text, ms) => {
    const id = ++seq;
    set({ toasts: [...get().toasts.slice(-3), { id, kind, text }] });
    const timeout = ms ?? (kind === 'error' ? 8000 : 3500);
    setTimeout(() => get().dismiss(id), timeout);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Короткие помощники, чтобы вызывать из любого обработчика. */
export const toast = {
  success: (text: string) => useToastStore.getState().push('success', text),
  error: (text: string) => useToastStore.getState().push('error', text),
  info: (text: string) => useToastStore.getState().push('info', text),
};
