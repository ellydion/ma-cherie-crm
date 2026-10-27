-- 19: закрытие предупреждений Supabase advisors (security), 27.10.2026
-- 1) handle_new_user вызывается только триггером on_auth_user_created (auth.users).
--    Права EXECUTE на триггерную функцию при срабатывании триггера не проверяются,
--    поэтому отзыв у anon/authenticated/public регистрацию не ломает, но убирает /rest/v1/rpc/handle_new_user.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- 2) update_updated_at_column: фиксируем search_path (lint 0011). Тело использует только now().
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
-- Не меняем (нужны приложению):
--   is_admin() используется в RLS-политиках, authenticated обязан иметь EXECUTE.
--   decrement_ingredient_quantity() вызывает касса (списание), внутри проверка auth.uid() и qty.
