import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

export type Profile = {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  avatar: string;
};

type Store = {
  profile: Profile | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;
  signOut: () => Promise<void>;
};

export const useProfileStore = create<Store>()(
  persist(
    (set) => ({
      profile: null,
      fetchProfile: async () => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          set({ profile: null });
          return;
        }
        const { data } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
        set({
          profile: data || {
            id: auth.user.id,
            name: (auth.user.user_metadata?.name as string) || auth.user.email || 'Сотрудник',
            position: (auth.user.user_metadata?.position as string) || 'Бариста',
            phone: '',
            email: auth.user.email || '',
            avatar: '👨‍🍳',
          },
        });
      },
      updateProfile: (data) => set((s) => ({ profile: s.profile ? { ...s.profile, ...data } : null })),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ profile: null });
        window.location.href = '/login';
      },
    }),
    { name: 'ma-cherie-profile' }
  )
);
