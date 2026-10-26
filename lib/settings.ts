// Настройки заведения. Хранятся в одной строке public.app_settings
// (колонки jsonb pos_settings, inventory_settings, company).
// Читают все вошедшие, пишет только админ (RLS settings_write = is_admin()).
// Если строки ещё нет или ключа нет, работают значения по умолчанию,
// поэтому поведение без настроек совпадает с прежним захардкоженным.

export const LOYALTY_LEVELS = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const;
export type LoyaltyLevel = (typeof LOYALTY_LEVELS)[number];

export type PosSettings = {
  /** Десерты видны и продаются на кассе Кофейни, а их продажи видны баристе. */
  dessertsInCoffee: boolean;
  /** Показывать на кассе товары, убранные в техкартах. */
  showHiddenOnPos: boolean;
  /** Списывать ингредиенты по техкартам и остатки товара при продаже. */
  autoWriteOff: boolean;
  /** Кнопки оплаты. */
  cashEnabled: boolean;
  transferEnabled: boolean;
  /** Стол по умолчанию на кассе. */
  defaultTable: string;
  /** Скидка на кассе по уровню лояльности, %. */
  loyaltyDiscounts: Record<LoyaltyLevel, number>;
  /** Сколько сомов чека дают 1 балл. 0 отключает начисление. */
  somPerPoint: number;
  /** Автообновление дашборда, отчётов и смен, секунды. */
  refreshSeconds: number;
};

export type InventorySettings = {
  /** Минимальный остаток по умолчанию для нового ингредиента. */
  defaultMinThreshold: number;
};

export type CompanySettings = {
  /** Название в боковом меню. */
  name: string;
};

export type AppSettings = { pos: PosSettings; inventory: InventorySettings; company: CompanySettings };

export const DEFAULT_SETTINGS: AppSettings = {
  pos: {
    dessertsInCoffee: true,
    showHiddenOnPos: false,
    autoWriteOff: true,
    cashEnabled: true,
    transferEnabled: true,
    defaultTable: 'Стол 1',
    loyaltyDiscounts: { Bronze: 0, Silver: 5, Gold: 10, Platinum: 15 },
    somPerPoint: 10,
    refreshSeconds: 20,
  },
  inventory: { defaultMinThreshold: 5 },
  company: { name: 'Ma Cherie' },
};

const num = (v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(v);
  if (v === null || v === undefined || v === '' || !Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
};
const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
const str = (v: unknown, def: string) => (typeof v === 'string' && v.trim() ? v.trim() : def);

/** Собирает настройки из строки БД, подставляя значения по умолчанию и ограничивая диапазоны. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsonb из БД без схемы
export function normalizeSettings(row: any): AppSettings {
  const d = DEFAULT_SETTINGS;
  const pos = (row?.pos_settings && typeof row.pos_settings === 'object') ? row.pos_settings : {};
  const inv = (row?.inventory_settings && typeof row.inventory_settings === 'object') ? row.inventory_settings : {};
  const company = (row?.company && typeof row.company === 'object') ? row.company : {};
  const disc = (pos.loyaltyDiscounts && typeof pos.loyaltyDiscounts === 'object') ? pos.loyaltyDiscounts : {};
  const loyaltyDiscounts = Object.fromEntries(
    LOYALTY_LEVELS.map((l) => [l, num(disc[l], d.pos.loyaltyDiscounts[l], 0, 100)]),
  ) as Record<LoyaltyLevel, number>;
  return {
    pos: {
      dessertsInCoffee: bool(pos.dessertsInCoffee, d.pos.dessertsInCoffee),
      showHiddenOnPos: bool(pos.showHiddenOnPos, d.pos.showHiddenOnPos),
      autoWriteOff: bool(pos.autoWriteOff, d.pos.autoWriteOff),
      cashEnabled: bool(pos.cashEnabled, d.pos.cashEnabled),
      transferEnabled: bool(pos.transferEnabled, d.pos.transferEnabled),
      defaultTable: str(pos.defaultTable, d.pos.defaultTable),
      loyaltyDiscounts,
      somPerPoint: num(pos.somPerPoint, d.pos.somPerPoint, 0, 100000),
      refreshSeconds: num(pos.refreshSeconds, d.pos.refreshSeconds, 5, 600),
    },
    inventory: {
      defaultMinThreshold: num(inv.defaultMinThreshold, d.inventory.defaultMinThreshold, 0, 1000000),
    },
    company: { name: str(company.name, d.company.name) },
  };
}

export function discountFor(level: string | null | undefined, s: AppSettings = DEFAULT_SETTINGS) {
  return (s.pos.loyaltyDiscounts as Record<string, number>)[level || ''] ?? 0;
}

export function pointsFor(total: number, s: AppSettings = DEFAULT_SETTINGS) {
  return s.pos.somPerPoint > 0 ? Math.round(total / s.pos.somPerPoint) : 0;
}
