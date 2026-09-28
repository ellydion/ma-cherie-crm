-- MA CHERIE — reset без $$ (безопасная вставка из чата)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS techcard_ingredients CASCADE;
DROP TABLE IF EXISTS techcards CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;

DROP FUNCTION IF EXISTS increment_product_quantity(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS decrement_product_quantity(UUID, NUMERIC);
DROP FUNCTION IF EXISTS handle_new_user();

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'шт',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_threshold NUMERIC NOT NULL DEFAULT 5,
  section TEXT NOT NULL DEFAULT 'coffee' CHECK (section IN ('coffee', 'kitchen')),
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'coffee',
  is_ingredient BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE techcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'coffee',
  yield NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE techcard_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  techcard_id UUID REFERENCES techcards(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'шт'
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  loyalty_level TEXT DEFAULT 'Bronze',
  points INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  items TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer')),
  status TEXT DEFAULT 'completed',
  cashier_id UUID,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  position TEXT DEFAULT 'Barista',
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'student')),
  phone TEXT,
  email TEXT,
  avatar TEXT DEFAULT '👨‍🍳',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_settings JSONB DEFAULT '{"autoWriteOff": true, "roundTotal": true, "orderTimeout": 30}'::jsonb,
  inventory_settings JSONB DEFAULT '{"lowStockNotifications": true, "defaultMinThreshold": 5, "notifyOnZero": true}'::jsonb,
  company JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  note TEXT
);

CREATE OR REPLACE FUNCTION increment_product_quantity(product_name TEXT, qty NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS '
BEGIN
  UPDATE products SET quantity = quantity + qty, updated_at = NOW()
  WHERE name = product_name;
END;
';

CREATE OR REPLACE FUNCTION decrement_product_quantity(product_id UUID, qty NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS '
BEGIN
  UPDATE products
  SET quantity = GREATEST(quantity - qty, 0), updated_at = NOW()
  WHERE id = product_id;
END;
';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS '
BEGIN
  INSERT INTO public.profiles (id, name, email, position, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>''name'', split_part(NEW.email, ''@'', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>''position'', ''Barista''),
    COALESCE(NEW.raw_user_meta_data->>''role'', ''staff'')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO products (name, unit, quantity, min_threshold, section, price, category, is_ingredient) VALUES
('Эспрессо', 'шт', 999, 10, 'coffee', 120, 'coffee', false),
('Американо', 'шт', 999, 10, 'coffee', 150, 'coffee', false),
('Американо 250 ml', 'шт', 999, 10, 'coffee', 140, 'coffee', false),
('Капучино', 'шт', 999, 8, 'coffee', 180, 'coffee', false),
('Капучино 250 ml', 'шт', 999, 8, 'coffee', 160, 'coffee', false),
('Капучино 350 ml', 'шт', 999, 8, 'coffee', 200, 'coffee', false),
('Латте', 'шт', 999, 8, 'coffee', 190, 'coffee', false),
('Латте 250 ml', 'шт', 999, 8, 'coffee', 160, 'coffee', false),
('Латте 350 ml', 'шт', 999, 8, 'coffee', 210, 'coffee', false),
('Флэт Уайт', 'шт', 999, 8, 'coffee', 200, 'coffee', false),
('Раф', 'шт', 999, 8, 'coffee', 220, 'coffee', false),
('Мокко', 'шт', 999, 8, 'coffee', 230, 'coffee', false),
('Какао', 'шт', 999, 8, 'coffee', 200, 'coffee', false),
('Айс Американо', 'шт', 999, 8, 'coffee', 180, 'coffee', false),
('Айс Капучино', 'шт', 999, 8, 'coffee', 210, 'coffee', false),
('Айс Латте', 'шт', 999, 8, 'coffee', 220, 'coffee', false),
('Бамбл', 'шт', 999, 8, 'coffee', 250, 'coffee', false),
('Клубничный мохито', 'шт', 999, 8, 'coffee', 180, 'coffee', false),
('Шаверма классическая', 'шт', 40, 5, 'kitchen', 280, 'kitchen', false),
('Пицца Маргарита', 'шт', 20, 3, 'kitchen', 450, 'kitchen', false),
('Бургер классический', 'шт', 25, 5, 'kitchen', 320, 'kitchen', false),
('Паста Карбонара', 'шт', 20, 5, 'kitchen', 380, 'kitchen', false),
('Кола', 'шт', 80, 15, 'kitchen', 120, 'drinks', false),
('Вода', 'шт', 80, 15, 'kitchen', 40, 'drinks', false),
('Лимонад Апельсиновый', 'шт', 40, 8, 'kitchen', 170, 'drinks', false),
('Лимонад Манго-Маркуйя', 'шт', 40, 8, 'kitchen', 180, 'drinks', false),
('Лимонад Клубничный', 'шт', 40, 8, 'kitchen', 175, 'drinks', false),
('Чизкейк Нью-Йорк', 'шт', 16, 4, 'kitchen', 280, 'desserts', false),
('Круассан с шоколадом', 'шт', 30, 8, 'kitchen', 150, 'desserts', false),
('Корзинка с голубикой', 'шт', 20, 5, 'kitchen', 170, 'desserts', false),
('Корзинка с клубникой', 'шт', 20, 5, 'kitchen', 180, 'desserts', false),
('Дополнительное молоко', 'шт', 50, 10, 'coffee', 30, 'coffee', false);

INSERT INTO products (name, unit, quantity, min_threshold, section, price, category, is_ingredient) VALUES
('Зерно эспрессо', 'кг', 8, 2, 'coffee', 0, 'coffee', true),
('Молоко 3.2%', 'л', 20, 5, 'coffee', 0, 'coffee', true),
('Молоко альтернативное', 'л', 6, 2, 'coffee', 0, 'coffee', true),
('Сироп ваниль', 'л', 3, 1, 'coffee', 0, 'coffee', true),
('Лёд', 'кг', 10, 3, 'coffee', 0, 'coffee', true),
('Лимон', 'шт', 25, 8, 'kitchen', 0, 'drinks', true),
('Апельсин', 'шт', 20, 8, 'kitchen', 0, 'drinks', true),
('Манго-пюре', 'кг', 4, 1, 'kitchen', 0, 'drinks', true),
('Клубника', 'кг', 3, 1, 'kitchen', 0, 'drinks', true),
('Лаваш', 'шт', 40, 10, 'kitchen', 0, 'kitchen', true),
('Курица', 'кг', 6, 2, 'kitchen', 0, 'kitchen', true),
('Тесто пицца', 'шт', 15, 5, 'kitchen', 0, 'kitchen', true),
('Сыр моцарелла', 'кг', 3, 1, 'kitchen', 0, 'kitchen', true),
('Булочка бургер', 'шт', 24, 8, 'kitchen', 0, 'kitchen', true),
('Котлета говяжья', 'шт', 20, 6, 'kitchen', 0, 'kitchen', true),
('Паста', 'кг', 4, 1, 'kitchen', 0, 'kitchen', true),
('Сливки', 'л', 4, 1, 'kitchen', 0, 'kitchen', true);

INSERT INTO techcards (name, category, yield, cost_price) VALUES
('Латте', 'coffee', 300, 55),
('Капучино', 'coffee', 250, 48),
('Американо', 'coffee', 200, 22),
('Айс Латте', 'coffee', 350, 62),
('Шаверма классическая', 'kitchen', 350, 145);

INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.018, 'кг' FROM techcards t, products p
WHERE t.name = 'Латте' AND p.name = 'Зерно эспрессо';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.20, 'л' FROM techcards t, products p
WHERE t.name = 'Латте' AND p.name = 'Молоко 3.2%';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.018, 'кг' FROM techcards t, products p
WHERE t.name = 'Капучино' AND p.name = 'Зерно эспрессо';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.15, 'л' FROM techcards t, products p
WHERE t.name = 'Капучино' AND p.name = 'Молоко 3.2%';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.018, 'кг' FROM techcards t, products p
WHERE t.name = 'Американо' AND p.name = 'Зерно эспрессо';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.018, 'кг' FROM techcards t, products p
WHERE t.name = 'Айс Латте' AND p.name = 'Зерно эспрессо';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.18, 'л' FROM techcards t, products p
WHERE t.name = 'Айс Латте' AND p.name = 'Молоко 3.2%';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.10, 'кг' FROM techcards t, products p
WHERE t.name = 'Айс Латте' AND p.name = 'Лёд';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 1, 'шт' FROM techcards t, products p
WHERE t.name = 'Шаверма классическая' AND p.name = 'Лаваш';
INSERT INTO techcard_ingredients (techcard_id, product_id, quantity, unit)
SELECT t.id, p.id, 0.15, 'кг' FROM techcards t, products p
WHERE t.name = 'Шаверма классическая' AND p.name = 'Курица';

INSERT INTO customers (name, phone, loyalty_level, points, total_spent) VALUES
('Айжан Султанова', '+996555123456', 'Gold', 2450, 12480),
('Мария Иванова', '+996700555333', 'Platinum', 4120, 28900);

INSERT INTO suppliers (name, contact, phone) VALUES
('Кофейный Дом', 'Закупки', '+996555111222'),
('Молочная Ферма', 'Айгуль', '+996700333444');

INSERT INTO app_settings (company) VALUES
('{"name":"Ma Cherie Coffee & More","legal_name":"OsOO Ma Cherie","address":"Bishkek","phone":"+996 555 123 456","email":"info@macherie.coffee","working_hours":"Mon-Sat 08:00-20:00","locations":2}'::jsonb);

INSERT INTO notifications (title, message, type) VALUES
('Система восстановлена', 'База и меню Ma Cherie загружены.', 'info');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE techcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE techcard_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access" ON products;
CREATE POLICY "Authenticated full access" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON techcards;
CREATE POLICY "Authenticated full access" ON techcards FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON techcard_ingredients;
CREATE POLICY "Authenticated full access" ON techcard_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON customers;
CREATE POLICY "Authenticated full access" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON suppliers;
CREATE POLICY "Authenticated full access" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON deliveries;
CREATE POLICY "Authenticated full access" ON deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON orders;
CREATE POLICY "Authenticated full access" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON order_items;
CREATE POLICY "Authenticated full access" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON notifications;
CREATE POLICY "Authenticated full access" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON profiles;
CREATE POLICY "Authenticated full access" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON app_settings;
CREATE POLICY "Authenticated full access" ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated full access" ON shifts;
CREATE POLICY "Authenticated full access" ON shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT TO anon USING (true);

SELECT 'OK: schema + menu ready' AS status;
SELECT COUNT(*) FILTER (WHERE is_ingredient = false) AS menu_items,
       COUNT(*) FILTER (WHERE is_ingredient = true) AS ingredients
FROM products;
