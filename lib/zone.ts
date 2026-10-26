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

type ProductLike = { section?: string | null; category?: string | null; name?: string | null };

export function isDessert(p: ProductLike | null | undefined) {
  return (p?.category || '').toLowerCase() === 'desserts';
}

// Видимость товара по зоне (касса, список товаров). Десерты продаются и на кухне,
// и в кофейне, поэтому при включённой настройке «Десерты в кофейне» видны в обеих зонах.
export function visibleInZone(p: ProductLike, zone: Zone, dessertsInCoffee = true): boolean {
  if (zone === 'all') return true;
  if (dessertsInCoffee && isDessert(p)) return true;
  return productZone(p) === zone;
}

/** Для каких зон считаем продажу, если у заказа нет своей зоны (старые заказы). */
export type SaleZoneContext = {
  dessertsInCoffee: boolean;
  /** Зона кассира по cashier_id (из профилей и почты). */
  cashierZones: Map<string, Zone>;
};

/** Зона, в которой пробит заказ: orders.zone, иначе зона кассира. null, если неизвестно. */
export function saleZone(
  order: { zone?: string | null; cashier_id?: string | null } | null | undefined,
  ctx: SaleZoneContext,
): ProductZone | null {
  const z = order?.zone;
  if (z === 'coffee' || z === 'kitchen') return z;
  const cz = order?.cashier_id ? ctx.cashierZones.get(order.cashier_id) : undefined;
  if (cz === 'coffee' || cz === 'kitchen') return cz;
  return null;
}

/**
 * Относится ли позиция заказа к зоне для отчётов и дашборда.
 * Обычные товары: по productZone. Десерты (если продаются в кофейне):
 * по зоне, где пробит заказ; если она неизвестна, десерт виден в обеих зонах.
 */
export function lineInZone(
  product: ProductLike | null | undefined,
  zone: Zone,
  order: { zone?: string | null; cashier_id?: string | null } | null | undefined,
  ctx: SaleZoneContext,
): boolean {
  if (zone === 'all') return true;
  const p = product || {};
  if (ctx.dessertsInCoffee && isDessert(p)) {
    const sz = saleZone(order, ctx);
    return sz ? sz === zone : true;
  }
  return productZone(p) === zone;
}

export function zoneLabel(zone: Zone | ProductZone) {
  if (zone === 'kitchen') return 'Кухня';
  if (zone === 'coffee') return 'Кофейня';
  return 'Всё';
}
