-- Ma Cherie: hardening without wiping data.
-- Run once in Supabase SQL editor.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS '
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND (role = ''admin'' OR lower(email) = ''admin@macherie.coffee'')
  );
';

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.decrement_ingredient_quantity(ingredient_id UUID, qty NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS '
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION ''auth required'';
  END IF;
  IF qty IS NULL OR qty < 0 THEN
    RAISE EXCEPTION ''bad qty'';
  END IF;
  UPDATE ingredients
  SET quantity = GREATEST(quantity - qty, 0), updated_at = NOW()
  WHERE id = ingredient_id;
END;
';

REVOKE ALL ON FUNCTION public.decrement_ingredient_quantity(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_ingredient_quantity(UUID, NUMERIC) TO authenticated;

DO '
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    ''products'',''ingredients'',''product_ingredients'',''techcards'',''techcard_ingredients'',
    ''customers'',''suppliers'',''deliveries'',''orders'',''order_items'',''notifications'',
    ''profiles'',''app_settings'',''shifts'',''checklist_tasks'',''shift_checks''
  ]
  LOOP
    IF to_regclass(''public.'' || t) IS NOT NULL THEN
      EXECUTE format(''ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY'', t);
      EXECUTE format(''ALTER TABLE public.%I FORCE ROW LEVEL SECURITY'', t);
      EXECUTE format(''DROP POLICY IF EXISTS "auth all" ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS "anon read products" ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS "anon read ingredients" ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS "anon read recipes" ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS staff_select ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS staff_insert ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS staff_update ON public.%I'', t);
      EXECUTE format(''DROP POLICY IF EXISTS admin_delete ON public.%I'', t);
      EXECUTE format(''REVOKE ALL ON TABLE public.%I FROM anon'', t);
    END IF;
  END LOOP;
END;
';

DO '
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    ''products'',''ingredients'',''product_ingredients'',
    ''customers'',''suppliers'',''deliveries'',
    ''orders'',''order_items'',''notifications'',
    ''shifts'',''checklist_tasks'',''shift_checks'',
    ''techcards'',''techcard_ingredients''
  ]
  LOOP
    IF to_regclass(''public.'' || t) IS NOT NULL THEN
      EXECUTE format(''CREATE POLICY staff_select ON public.%I FOR SELECT TO authenticated USING (true)'', t);
      EXECUTE format(''CREATE POLICY staff_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (true)'', t);
      EXECUTE format(''CREATE POLICY staff_update ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)'', t);
      EXECUTE format(''CREATE POLICY admin_delete ON public.%I FOR DELETE TO authenticated USING (public.is_admin())'', t);
    END IF;
  END LOOP;
END;
';

DROP POLICY IF EXISTS staff_select ON profiles;
DROP POLICY IF EXISTS staff_insert ON profiles;
DROP POLICY IF EXISTS staff_update ON profiles;
DROP POLICY IF EXISTS admin_delete ON profiles;
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS profiles_update ON profiles;

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

DROP POLICY IF EXISTS staff_select ON app_settings;
DROP POLICY IF EXISTS staff_insert ON app_settings;
DROP POLICY IF EXISTS staff_update ON app_settings;
DROP POLICY IF EXISTS admin_delete ON app_settings;
DROP POLICY IF EXISTS settings_select ON app_settings;
DROP POLICY IF EXISTS settings_write ON app_settings;

CREATE POLICY settings_select ON app_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY settings_write ON app_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

UPDATE profiles
SET role = 'admin'
WHERE lower(email) = 'admin@macherie.coffee';

SELECT 'security ok' AS status, public.is_admin() AS you_are_admin;
