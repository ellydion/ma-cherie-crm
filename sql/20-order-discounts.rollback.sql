-- Откат sql/20. ВНИМАНИЕ: удаляет колонки вместе с записанными в них скидками.
-- Перед откатом сохрани их, например:
--   CREATE TABLE public.orders_discount_backup_20 AS
--     SELECT id, discount_percent, discount_amount FROM public.orders
--     WHERE discount_percent IS NOT NULL OR discount_amount IS NOT NULL;
-- Код кассы после отката продолжит работать (повторяет вставку без колонок).

BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_discount_amount_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_discount_percent_check;
ALTER TABLE public.orders DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE public.orders DROP COLUMN IF EXISTS discount_percent;
COMMIT;
