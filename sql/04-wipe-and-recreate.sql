-- MA CHERIE: полный снос CRM-таблиц и создание заново + RLS
-- auth.users не удаляются

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP VIEW IF EXISTS warehouse_stock CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS product_ingredients CASCADE;
DROP TABLE IF EXISTS techcard_ingredients CASCADE;
DROP TABLE IF EXISTS techcards CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;

DROP FUNCTION IF EXISTS increment_product_quantity(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS decrement_product_quantity(UUID, NUMERIC);
DROP FUNCTION IF EXISTS increment_ingredient_quantity(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS decrement_ingredient_quantity(UUID, NUMERIC);
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
  track_stock BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'шт',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_threshold NUMERIC NOT NULL DEFAULT 5,
  section TEXT NOT NULL DEFAULT 'coffee' CHECK (section IN ('coffee', 'kitchen')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'шт'
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
  product_id UUID,
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
  pos_settings JSONB DEFAULT '{"autoWriteOff": true}'::jsonb,
  inventory_settings JSONB DEFAULT '{"lowStockNotifications": true}'::jsonb,
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

CREATE OR REPLACE VIEW warehouse_stock AS
SELECT id, name, unit, quantity, min_threshold, section, 'ingredient'::text AS kind FROM ingredients
UNION ALL
SELECT id, name, unit, quantity, min_threshold, section, 'product'::text AS kind FROM products WHERE track_stock = true;

CREATE OR REPLACE FUNCTION increment_ingredient_quantity(ingredient_name TEXT, qty NUMERIC)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS '
BEGIN
  UPDATE ingredients SET quantity = quantity + qty, updated_at = NOW() WHERE name = ingredient_name;
END;
';

CREATE OR REPLACE FUNCTION decrement_ingredient_quantity(ingredient_id UUID, qty NUMERIC)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS '
BEGIN
  UPDATE ingredients SET quantity = GREATEST(quantity - qty, 0), updated_at = NOW() WHERE id = ingredient_id;
END;
';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS '
BEGIN
  INSERT INTO public.profiles (id, name, email, position, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>''name'', split_part(NEW.email, ''@'', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>''position'', ''Barista''),
    COALESCE(NEW.raw_user_meta_data->>''role'', ''staff'')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO products (name, unit, quantity, min_threshold, section, price, category, track_stock) VALUES
('Эспрессо', 'шт', 0, 0, 'coffee', 120, 'coffee', false),
('Американо', 'шт', 0, 0, 'coffee', 150, 'coffee', false),
('Американо 250 ml', 'шт', 0, 0, 'coffee', 140, 'coffee', false),
('Капучино', 'шт', 0, 0, 'coffee', 180, 'coffee', false),
('Капучино 250 ml', 'шт', 0, 0, 'coffee', 160, 'coffee', false),
('Капучино 350 ml', 'шт', 0, 0, 'coffee', 200, 'coffee', false),
('Латте', 'шт', 0, 0, 'coffee', 190, 'coffee', false),
('Латте 250 ml', 'шт', 0, 0, 'coffee', 160, 'coffee', false),
('Латте 350 ml', 'шт', 0, 0, 'coffee', 210, 'coffee', false),
('Флэт Уайт', 'шт', 0, 0, 'coffee', 200, 'coffee', false),
('Раф', 'шт', 0, 0, 'coffee', 220, 'coffee', false),
('Мокко', 'шт', 0, 0, 'coffee', 230, 'coffee', false),
('Какао', 'шт', 0, 0, 'coffee', 200, 'coffee', false),
('Айс Американо', 'шт', 0, 0, 'coffee', 180, 'coffee', false),
('Айс Капучино', 'шт', 0, 0, 'coffee', 210, 'coffee', false),
('Айс Латте', 'шт', 0, 0, 'coffee', 220, 'coffee', false),
('Бамбл', 'шт', 0, 0, 'coffee', 250, 'coffee', false),
('Клубничный мохито', 'шт', 0, 0, 'coffee', 180, 'coffee', false),
('Шаверма классическая', 'шт', 0, 0, 'kitchen', 280, 'kitchen', false),
('Пицца Маргарита', 'шт', 0, 0, 'kitchen', 450, 'kitchen', false),
('Бургер классический', 'шт', 0, 0, 'kitchen', 320, 'kitchen', false),
('Паста Карбонара', 'шт', 0, 0, 'kitchen', 380, 'kitchen', false),
('Кола', 'шт', 80, 15, 'kitchen', 120, 'drinks', true),
('Вода', 'шт', 80, 15, 'kitchen', 40, 'drinks', true),
('Лимонад Апельсиновый', 'шт', 0, 0, 'kitchen', 170, 'drinks', false),
('Лимонад Манго-Маркуйя', 'шт', 0, 0, 'kitchen', 180, 'drinks', false),
('Лимонад Клубничный', 'шт', 0, 0, 'kitchen', 175, 'drinks', false),
('Чизкейк Нью-Йорк', 'шт', 16, 4, 'kitchen', 280, 'desserts', true),
('Круассан с шоколадом', 'шт', 30, 8, 'kitchen', 150, 'desserts', true),
('Корзинка с голубикой', 'шт', 20, 5, 'kitchen', 170, 'desserts', true),
('Корзинка с клубникой', 'шт', 20, 5, 'kitchen', 180, 'desserts', true),
('Дополнительное молоко', 'шт', 50, 10, 'coffee', 30, 'coffee', true);

INSERT INTO ingredients (name, unit, quantity, min_threshold, section) VALUES
('Зерно эспрессо', 'кг', 8, 2, 'coffee'),
('Молоко 3.2%', 'л', 20, 5, 'coffee'),
('Молоко альтернативное', 'л', 6, 2, 'coffee'),
('Сироп ваниль', 'л', 3, 1, 'coffee'),
('Лёд', 'кг', 10, 3, 'coffee'),
('Лимон', 'шт', 25, 8, 'kitchen'),
('Апельсин', 'шт', 20, 8, 'kitchen'),
('Манго-пюре', 'кг', 4, 1, 'kitchen'),
('Клубника', 'кг', 3, 1, 'kitchen'),
('Лаваш', 'шт', 40, 10, 'kitchen'),
('Курица', 'кг', 6, 2, 'kitchen'),
('Тесто пицца', 'шт', 15, 5, 'kitchen'),
('Сыр моцарелла', 'кг', 3, 1, 'kitchen'),
('Булочка бургер', 'шт', 24, 8, 'kitchen'),
('Котлета говяжья', 'шт', 20, 6, 'kitchen'),
('Паста', 'кг', 4, 1, 'kitchen'),
('Сливки', 'л', 4, 1, 'kitchen');

INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.018, 'кг' FROM products p, ingredients i WHERE p.name = 'Латте' AND i.name = 'Зерно эспрессо';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.20, 'л' FROM products p, ingredients i WHERE p.name = 'Латте' AND i.name = 'Молоко 3.2%';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.018, 'кг' FROM products p, ingredients i WHERE p.name = 'Капучино' AND i.name = 'Зерно эспрессо';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.15, 'л' FROM products p, ingredients i WHERE p.name = 'Капучино' AND i.name = 'Молоко 3.2%';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.018, 'кг' FROM products p, ingredients i WHERE p.name = 'Американо' AND i.name = 'Зерно эспрессо';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.018, 'кг' FROM products p, ingredients i WHERE p.name = 'Эспрессо' AND i.name = 'Зерно эспрессо';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.018, 'кг' FROM products p, ingredients i WHERE p.name = 'Айс Латте' AND i.name = 'Зерно эспрессо';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.18, 'л' FROM products p, ingredients i WHERE p.name = 'Айс Латте' AND i.name = 'Молоко 3.2%';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.10, 'кг' FROM products p, ingredients i WHERE p.name = 'Айс Латте' AND i.name = 'Лёд';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 1, 'шт' FROM products p, ingredients i WHERE p.name = 'Шаверма классическая' AND i.name = 'Лаваш';
INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.15, 'кг' FROM products p, ingredients i WHERE p.name = 'Шаверма классическая' AND i.name = 'Курица';

INSERT INTO customers (name, phone, loyalty_level, points, total_spent) VALUES
('Айжан Султанова', '+996555123456', 'Gold', 2450, 12480),
('Мария Иванова', '+996700555333', 'Platinum', 4120, 28900);

INSERT INTO suppliers (name, contact, phone) VALUES
('Кофейный Дом', 'Закупки', '+996555111222'),
('Молочная Ферма', 'Айгуль', '+996700333444');

INSERT INTO app_settings (company) VALUES ('{"name":"Ma Cherie Coffee & More","city":"Bishkek"}'::jsonb);
INSERT INTO notifications (title, message, type) VALUES ('База пересоздана', 'Товары, ингредиенты и склад загружены.', 'info');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "auth all" ON products;
CREATE POLICY "auth all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon read products" ON products;
CREATE POLICY "anon read products" ON products FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth all" ON ingredients;
CREATE POLICY "auth all" ON ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon read ingredients" ON ingredients;
CREATE POLICY "anon read ingredients" ON ingredients FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth all" ON product_ingredients;
CREATE POLICY "auth all" ON product_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon read recipes" ON product_ingredients;
CREATE POLICY "anon read recipes" ON product_ingredients FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth all" ON techcards;
CREATE POLICY "auth all" ON techcards FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON techcard_ingredients;
CREATE POLICY "auth all" ON techcard_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON customers;
CREATE POLICY "auth all" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON suppliers;
CREATE POLICY "auth all" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON deliveries;
CREATE POLICY "auth all" ON deliveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON orders;
CREATE POLICY "auth all" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON order_items;
CREATE POLICY "auth all" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON notifications;
CREATE POLICY "auth all" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON profiles;
CREATE POLICY "auth all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON app_settings;
CREATE POLICY "auth all" ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON shifts;
CREATE POLICY "auth all" ON shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

SELECT 'OK wipe+create' AS status;
SELECT (SELECT COUNT(*) FROM products) AS products,
       (SELECT COUNT(*) FROM ingredients) AS ingredients,
       (SELECT COUNT(*) FROM warehouse_stock) AS warehouse;
