-- 18. Зона заказа и настройки заведения.
-- Только добавляет: новую nullable колонку, check-ограничение и уникальный индекс.
-- Ничего не удаляет, права staff не расширяет. Повторный запуск безопасен.
--
-- 1) orders.zone: где пробит заказ (coffee / kitchen / all). Касса пишет её с этой версии,
--    чтобы десерты, проданные в Кофейне, попадали в продажи баристы. Старые заказы
--    остаются NULL; для них зона берётся по кассиру (cashier_id), как и раньше в коде.
-- 2) app_settings: таблица и RLS уже есть (settings_select для authenticated,
--    settings_write только is_admin()). Добавляем лишь защиту от второй строки,
--    чтобы настройки всегда были в одной записи.

BEGIN;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zone text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_zone_check' AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_zone_check CHECK (zone IS NULL OR zone IN ('coffee', 'kitchen', 'all'));
  END IF;
END $$;

COMMENT ON COLUMN public.orders.zone IS 'Зона кассы, где пробит заказ: coffee, kitchen или all (админ). NULL для старых заказов.';

-- Одна строка настроек. Если строк уже больше одной, индекс не создастся,
-- и миграция упадёт целиком (транзакция), ничего не изменив.
CREATE UNIQUE INDEX IF NOT EXISTS app_settings_singleton ON public.app_settings ((true));

COMMIT;

-- Проверка после применения:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'zone';
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) FROM pg_policy
--   WHERE polrelid = 'public.app_settings'::regclass;
