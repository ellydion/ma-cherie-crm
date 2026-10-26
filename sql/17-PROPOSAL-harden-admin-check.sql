-- ПРЕДЛОЖЕНИЕ. НЕ ПРИМЕНЕНО к базе. Проверить на копии/staging перед запуском.
--
-- Проблема 1. is_admin() считает админом любого, у кого в profiles email = admin@macherie.coffee.
-- Политика profiles_update фиксирует только role, но не email, поэтому сотрудник может
-- поменять email в своём профиле и получить права администратора (удаление, настройки).
--
-- Проблема 2. У authenticated полный SELECT/INSERT/UPDATE на все рабочие таблицы (USING (true)).
-- Это осознанное упрощение для маленькой команды, но любой вошедший может, например,
-- менять цены, историю заказов и данные клиентов. Ниже только точечная правка 1;
-- ограничение по ролям для orders/order_items/products/customers стоит обсудить отдельно.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS '
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = ''admin''
  );
';

-- Перед этим убедиться, что у настоящего админа role = 'admin':
-- SELECT id, email, role FROM profiles WHERE lower(email) = 'admin@macherie.coffee';

-- Запретить менять в своём профиле роль и email (email правится только админом или через Auth).
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND role  IS NOT DISTINCT FROM (SELECT p.role  FROM public.profiles p WHERE p.id = auth.uid())
      AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

COMMIT;

-- Отдельно и срочно: в sql/16-zones-kitchen-user.sql в публичном репозитории лежит пароль
-- кухонного аккаунта. Его нужно сменить в Supabase Auth и убрать из файла (и из истории git).
