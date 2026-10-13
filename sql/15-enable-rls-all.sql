-- Fix Supabase alert: rls_disabled_in_public
-- Enables RLS on EVERY table in public. Does not delete data.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS '
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = ''admin'' OR lower(email) = ''admin@macherie.coffee'')
  );
';

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO '
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = ''public''
  LOOP
    EXECUTE format(''ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY'', r.tablename);
    EXECUTE format(''REVOKE ALL ON TABLE public.%I FROM anon, public'', r.tablename);
    EXECUTE format(''GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated'', r.tablename);
    EXECUTE format(''GRANT ALL ON TABLE public.%I TO service_role'', r.tablename);

    EXECUTE format(''DROP POLICY IF EXISTS staff_all ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS staff_select ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS staff_insert ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS staff_update ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS admin_delete ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS "auth all" ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS "anon read products" ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS "anon read ingredients" ON public.%I'', r.tablename);
    EXECUTE format(''DROP POLICY IF EXISTS "anon read recipes" ON public.%I'', r.tablename);

    IF r.tablename NOT IN (''profiles'', ''app_settings'') THEN
      EXECUTE format(''CREATE POLICY staff_select ON public.%I FOR SELECT TO authenticated USING (true)'', r.tablename);
      EXECUTE format(''CREATE POLICY staff_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (true)'', r.tablename);
      EXECUTE format(''CREATE POLICY staff_update ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)'', r.tablename);
      EXECUTE format(''CREATE POLICY admin_delete ON public.%I FOR DELETE TO authenticated USING (public.is_admin())'', r.tablename);
    END IF;
  END LOOP;
END;
';

DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;
DROP POLICY IF EXISTS admin_delete ON profiles;
DROP POLICY IF EXISTS staff_all ON profiles;

CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    )
  );

CREATE POLICY admin_delete ON profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS settings_select ON app_settings;
DROP POLICY IF EXISTS settings_write ON app_settings;
DROP POLICY IF EXISTS staff_all ON app_settings;

CREATE POLICY settings_select ON app_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY settings_write ON app_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DO '
BEGIN
  EXECUTE ''ALTER VIEW public.warehouse_stock SET (security_invoker = true)'';
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
';

UPDATE profiles
SET role = 'admin'
WHERE lower(email) = 'admin@macherie.coffee';

SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;
