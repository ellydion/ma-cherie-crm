import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';

interface Profile {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  avatar: string;
}

interface ProfileStore {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;
  signOut: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: null,
      loading: true,

      fetchProfile: async () => {
        set({ loading: true });
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          set({ profile: null, loading: false });
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Ошибка загрузки профиля:', error);
        }

        set({
          profile: data || {
            id: auth.user.id,
            name: (auth.user.user_metadata?.name as string) || auth.user.email || 'Сотрудник',
            position: (auth.user.user_metadata?.position as string) || 'Barista',
            phone: '',
            email: auth.user.email || '',
            avatar: '👨‍🍳',
          },
          loading: false,
        });
      },

      updateProfile: (data) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : null,
        })),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ profile: null, loading: false });
        window.location.href = '/login';
      },
    }),
    { name: 'ma-cherie-profile' }
  )
);
