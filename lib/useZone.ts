'use client';

import { useProfileStore } from '@/lib/store/profileStore';
import { useZoneViewStore } from '@/lib/store/zoneViewStore';
import { Zone } from '@/lib/zone';

export function useZone() {
  const profile = useProfileStore((s) => s.profile);
  const view = useZoneViewStore((s) => s.view);
  const locked: Zone | null = profile?.zone && profile.zone !== 'all' ? profile.zone : null;
  const zone: Zone = locked || view || 'all';
  const isAdmin = (profile?.email || '').toLowerCase() === 'admin@macherie.coffee' || profile?.role === 'admin';
  return { zone, locked, isAdmin, profile };
}
