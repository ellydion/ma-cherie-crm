import { supabase } from '@/lib/supabase/client';
import { Zone, zoneFromEmail } from '@/lib/zone';

/**
 * Зоны кассиров по id. RLS profiles отдаёт сотруднику только его строку,
 * админу все, поэтому дополнительно подставляем зону текущего пользователя.
 */
export async function loadCashierZones(me?: { id?: string | null; zone?: Zone | null }): Promise<Map<string, Zone>> {
  const map = new Map<string, Zone>();
  const { data } = await supabase.from('profiles').select('id, email, zone');
  (data || []).forEach((p: { id: string; email?: string | null; zone?: string | null }) => {
    const fromEmail = zoneFromEmail(p.email);
    const z: Zone = fromEmail !== 'all' ? fromEmail : (p.zone === 'coffee' || p.zone === 'kitchen' ? p.zone : 'all');
    map.set(p.id, z);
  });
  if (me?.id && me.zone) map.set(me.id, me.zone);
  return map;
}
