import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import { Zone, zoneFromEmail } from '@/lib/zone';

export type Profile = {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  avatar: string;
  role?: string;
  zone: Zone;
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
        const email = auth.user.email || '';
        const { data } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
        const fromEmail = zoneFromEmail(email);
        const zone: Zone = fromEmail !== 'all' ? fromEmail : (data?.zone === 'kitchen' || data?.zone === 'coffee' ? data.zone : 'all');
        set({
          profile: {
            id: auth.user.id,
            name: data?.name || (auth.user.user_metadata?.name as string) || email || 'Сотрудник',
            position: data?.position || (auth.user.user_metadata?.position as string) || (zone === 'kitchen' ? 'Кухня' : zone === 'coffee' ? 'Бариста' : 'Админ'),
            phone: data?.phone || '',
            email,
            avatar: data?.avatar || (zone === 'kitchen' ? '👨‍🍳' : '☕'),
            role: data?.role || 'staff',
            zone,
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
