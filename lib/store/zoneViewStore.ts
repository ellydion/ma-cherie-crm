import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Zone } from '@/lib/zone';

type Store = {
  view: Zone;
  setView: (view: Zone) => void;
};

export const useZoneViewStore = create<Store>()(
  persist(
    (set) => ({
      view: 'all',
      setView: (view) => set({ view }),
    }),
    { name: 'ma-cherie-zone-view' }
  )
);
