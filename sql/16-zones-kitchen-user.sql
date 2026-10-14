-- Zones + kitchen account. Run in Supabase SQL editor.
-- Password is set in the INSERT below. Change it after first login.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zone TEXT NOT NULL DEFAULT 'all';

UPDATE profiles SET zone = 'coffee', position = 'Бариста'
WHERE lower(email) = 'barista@macherie.coffee';

UPDATE profiles SET zone = 'kitchen', position = 'Кухня'
WHERE lower(email) = 'kitchen@macherie.coffee';

UPDATE profiles SET zone = 'all', role = 'admin'
WHERE lower(email) = 'admin@macherie.coffee';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'kitchen@macherie.coffee',
  crypt('123456789!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Кухня","position":"Кухня","role":"staff"}'::jsonb,
  now(), now(), '', '', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE lower(email) = 'kitchen@macherie.coffee'
);

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
FROM auth.users u
WHERE lower(u.email) = 'kitchen@macherie.coffee'
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);

INSERT INTO profiles (id, name, email, role, position, zone)
SELECT u.id, 'Кухня', u.email, 'staff', 'Кухня', 'kitchen'
FROM auth.users u
WHERE lower(u.email) = 'kitchen@macherie.coffee'
ON CONFLICT (id) DO UPDATE
SET role = 'staff', zone = 'kitchen', position = 'Кухня', email = EXCLUDED.email, updated_at = NOW();

SELECT email, role, zone, position FROM profiles
WHERE lower(email) IN ('admin@macherie.coffee', 'barista@macherie.coffee', 'kitchen@macherie.coffee')
ORDER BY email;
