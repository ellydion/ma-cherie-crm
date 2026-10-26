-- 17. Закрыть повышение прав через email в profiles.
-- ПРИМЕНЕНО на прод (Supabase, проект nnbijmnxzuemqazxuume) 2026-10-26
-- как миграция harden_admin_check. Откат: прежние определения сохранены
-- отдельно (rollback-admin-check.sql в материалах аудита).
--
-- Проблема: старая is_admin() считала админом любого, у кого в profiles
-- email = admin@macherie.coffee, а политика profiles_update позволяла
-- сотруднику менять свой email. Сотрудник мог сам себя сделать админом.
--
-- Решение:
--   * is_admin(): role = 'admin' в profiles ИЛИ email в auth.users
--     (auth.users.email уникален и не меняется через profiles);
--   * profiles_update: сотрудник не может менять у себя role и email.
--
-- На момент применения у админа не было строки в profiles, поэтому
-- проверка по auth.users обязательна, иначе админ потерял бы права.

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users u
     WHERE u.id = auth.uid() AND lower(u.email) = 'admin@macherie.coffee'
  );
$function$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((id = auth.uid()) OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND role  IS NOT DISTINCT FROM (SELECT p.role  FROM public.profiles p WHERE p.id = auth.uid())
      AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    )
  );
