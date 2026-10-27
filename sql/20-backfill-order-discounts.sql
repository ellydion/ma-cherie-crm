-- Бэкфилл скидок для старых заказов (НЕ применено). Запускать только после sql/20.
-- До кода со скидками касса писала скидку лишь в комментарий: «<гость> <Уровень> -10%».
-- На 27.10.2026 таких заказов 8, у всех сумма позиций минус total ровно 10%.
-- Меняет только discount_percent и discount_amount (где они ещё NULL). total, комментарий
-- и позиции не трогает. Если подходящих заказов не ровно 8, ничего не меняет.
--
-- Откат: UPDATE public.orders SET discount_percent = NULL, discount_amount = NULL
--   WHERE id IN (<те же 8 id, их выводит RAISE NOTICE ниже>);

DO $$
DECLARE
  expected constant int := 8;
  n int;
  ids text;
BEGIN
  CREATE TEMP TABLE _bf ON COMMIT DROP AS
  SELECT o.id,
         substring(o.comment FROM ' -([0-9]+(\.[0-9]+)?)%$')::numeric AS pct,
         s.items_sum - o.total AS amount
  FROM public.orders o
  JOIN LATERAL (SELECT sum(i.quantity * i.price) AS items_sum FROM public.order_items i WHERE i.order_id = o.id) s ON true
  WHERE o.comment ~ ' (Bronze|Silver|Gold|Platinum) -[0-9]+(\.[0-9]+)?%$'
    AND o.discount_percent IS NULL AND o.discount_amount IS NULL
    AND s.items_sum > o.total;

  SELECT count(*), string_agg(id::text, ', ') INTO n, ids FROM _bf;
  IF n <> expected THEN
    RAISE EXCEPTION 'Ожидалось % заказов, найдено %. Ничего не изменено.', expected, n;
  END IF;
  -- Проверка: сумма скидки совпадает с процентом из комментария (с точностью до 1 сома).
  IF EXISTS (SELECT 1 FROM _bf b JOIN public.orders o ON o.id = b.id
             WHERE abs(b.amount - round((b.amount + o.total) * b.pct / 100)) > 1) THEN
    RAISE EXCEPTION 'Сумма скидки не совпадает с процентом из комментария. Ничего не изменено.';
  END IF;

  UPDATE public.orders o SET discount_percent = b.pct, discount_amount = b.amount
  FROM _bf b WHERE o.id = b.id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'Обновлено % заказов: %', n, ids;
END $$;
