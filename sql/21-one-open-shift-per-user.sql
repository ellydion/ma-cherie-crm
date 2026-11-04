-- 21: одна открытая смена на пользователя (защита от двойного нажатия «Открыть смену»).
-- Перед применением убедиться, что дублей нет:
--   select user_id, count(*) from public.shifts where ended_at is null group by user_id having count(*) > 1;
create unique index if not exists shifts_one_open_per_user
  on public.shifts (user_id)
  where ended_at is null;
