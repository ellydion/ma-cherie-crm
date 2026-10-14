export type Zone = 'coffee' | 'kitchen' | 'all';
export type ProductZone = 'coffee' | 'kitchen';

export function zoneFromEmail(email?: string | null): Zone {
  const e = (email || '').toLowerCase();
  if (e === 'kitchen@macherie.coffee') return 'kitchen';
  if (e === 'barista@macherie.coffee') return 'coffee';
  if (e === 'admin@macherie.coffee') return 'all';
  return 'all';
}

export function productZone(p: { section?: string | null; category?: string | null; name?: string | null }): ProductZone {
  const cat = (p.category || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  if (cat === 'kitchen' || cat === 'desserts') return 'kitchen';
  if (name.includes('шаверм') || name.includes('пицц') || name.includes('бургер') || name.includes('паст') || name.includes('сэндвич')) return 'kitchen';
  if (p.section === 'kitchen' && cat !== 'drinks' && cat !== 'nitro' && cat !== 'asu' && cat !== 'coffee') return 'kitchen';
  return 'coffee';
}

export function zoneLabel(zone: Zone | ProductZone) {
  if (zone === 'kitchen') return 'Кухня';
  if (zone === 'coffee') return 'Кофейня';
  return 'Всё';
}
