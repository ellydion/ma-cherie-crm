CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  note TEXT
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shift_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashier_id UUID;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all" ON shifts;
CREATE POLICY "auth all" ON shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
