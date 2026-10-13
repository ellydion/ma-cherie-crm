-- Make admin@macherie.coffee an admin and ensure profile exists.
-- Run in Supabase SQL editor.

INSERT INTO profiles (id, name, email, role, position)
SELECT
  u.id,
  coalesce(u.raw_user_meta_data->>'name', 'Admin'),
  u.email,
  'admin',
  'Администратор'
FROM auth.users u
WHERE lower(u.email) = 'admin@macherie.coffee'
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    email = EXCLUDED.email,
    updated_at = NOW();

UPDATE profiles
SET role = 'admin', updated_at = NOW()
WHERE lower(email) = 'admin@macherie.coffee';

SELECT id, email, name, role, position
FROM profiles
WHERE lower(email) = 'admin@macherie.coffee';
