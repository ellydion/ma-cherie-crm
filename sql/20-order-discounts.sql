-- 20. Скидка заказа отдельными полями.
-- Только добавляет: две nullable колонки и check-ограничения. Ничего не удаляет,
-- права staff не расширяет (RLS orders не меняется). Повторный запуск безопасен.
-- НЕ применять до мержа и деплоя кода: касса и без этих колонок работает
-- (повторяет вставку без них), а после применения начинает их заполнять.
--
-- orders.total как и раньше уже со скидкой.
-- discount_percent: процент скидки по уровню лояльности гостя (из app_settings.pos_settings.loyaltyDiscounts).
-- discount_amount:  сумма скидки в сомах (сумма позиций минус total).
-- Старые заказы остаются NULL (их 8 со скидкой только в комментарии, см. sql/20-backfill-order-discounts.sql).

BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_percent numeric;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_discount_percent_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_discount_percent_check CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_discount_amount_check' AND conrelid = 'public.orders'::regclass) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_discount_amount_check CHECK (discount_amount IS NULL OR discount_amount >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.orders.discount_percent IS 'Скидка по лояльности, %. NULL для заказов до sql/20.';
COMMENT ON COLUMN public.orders.discount_amount IS 'Сумма скидки, сом (total уже со скидкой). NULL для заказов до sql/20.';

COMMIT;

-- Проверка после применения:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'orders' AND column_name LIKE 'discount_%';
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'public.orders'::regclass AND conname LIKE 'orders_discount_%';
