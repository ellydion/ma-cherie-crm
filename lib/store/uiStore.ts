import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiStore = {
  sidebarOpen: boolean;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebar: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'ma-cherie-ui' }
  )
);
