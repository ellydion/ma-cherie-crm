ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;

UPDATE ingredients SET cost_price = v.cost
FROM (VALUES
  ('Зерно эспрессо', 1200),
  ('Молоко 3.2%', 80),
  ('Молоко альтернативное', 110),
  ('Сироп ваниль', 450),
  ('Лёд', 25),
  ('Лимон', 15),
  ('Апельсин', 20),
  ('Манго-пюре', 350),
  ('Клубника', 280),
  ('Лаваш', 15),
  ('Курица', 420),
  ('Тесто пицца', 40),
  ('Сыр моцарелла', 650),
  ('Булочка бургер', 18),
  ('Котлета говяжья', 80),
  ('Паста', 180),
  ('Сливки', 220),
  ('Матча', 2800),
  ('Какао порошок', 600),
  ('Хлеб для сэндвича', 12),
  ('Малина с/м', 380),
  ('Смородина чёрная с/м', 660),
  ('Облепиха с/м', 360)
) AS v(name, cost)
WHERE ingredients.name = v.name;

INSERT INTO products (name, unit, quantity, min_threshold, section, price, category, track_stock, cost_price)
SELECT v.name, 'шт', 0, 6, 'kitchen', v.price, 'drinks', true, v.cost
FROM (VALUES
  ('Coca-Cola 0.45 Ж/Б', 75, 66.67),
  ('Coca-Cola 0.25 стекло', 125, 66.67),
  ('Coca-Cola 0.5 ПЭТ', 55, 50),
  ('Coca-Cola 1л ПЭТ', 90, 79.17),
  ('Coca-Cola 1.5л ПЭТ', 125, 108.33),
  ('Coca-Cola 2л ПЭТ', 160, 141.67),
  ('Coca-Cola Zero 0.45 Ж/Б', 75, 66.67),
  ('Coca-Cola Zero 0.25 стекло', 75, 66.67),
  ('Coca-Cola Zero 0.5 ПЭТ', 55, 50),
  ('Coca-Cola Zero 1л ПЭТ', 90, 79.17),
  ('Fanta 0.45 Ж/Б', 75, 66.67),
  ('Fanta 0.5 ПЭТ', 55, 50),
  ('Fanta 1л ПЭТ', 90, 79.17),
  ('Fanta 1.5л ПЭТ', 125, 108.33),
  ('Fanta 2л ПЭТ', 160, 141.67),
  ('Sprite 0.45 Ж/Б', 75, 66.67),
  ('Sprite 0.5 ПЭТ', 55, 50),
  ('Sprite 1л ПЭТ', 90, 79.17),
  ('Sprite 1.5л ПЭТ', 125, 108.33),
  ('Sprite 2л ПЭТ', 160, 141.67),
  ('BonAqua негаз 0.5', 30, 25),
  ('BonAqua негаз 1л', 40, 33.33),
  ('BonAqua газ 0.5', 30, 25),
  ('BonAqua газ 1л', 40, 33.33),
  ('Fuse Tea 0.45 Ж/Б', 75, 66.67),
  ('Fuse Tea 0.5 ПЭТ', 55, 50),
  ('Fuse Tea 1л ПЭТ', 90, 79.17),
  ('Piko 1л тетра', 45, 41.67),
  ('Piko Pulpy 0.5', 80, 75),
  ('Piko Pulpy 1л', 140, 125),
  ('Schweppes 0.45 Ж/Б', 75, 66.67)
) AS v(name, price, cost)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

UPDATE products SET price = 125, cost_price = 66.67, category = 'drinks', track_stock = true
WHERE name = 'Coca-Cola 0.25 стекло';

CREATE TABLE IF NOT EXISTS checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'day' CHECK (phase IN ('open', 'day', 'close')),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shift_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES checklist_tasks(id) ON DELETE CASCADE,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ
);

ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth all" ON checklist_tasks;
CREATE POLICY "auth all" ON checklist_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth all" ON shift_checks;
CREATE POLICY "auth all" ON shift_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO checklist_tasks (title, phase, sort)
SELECT v.title, v.phase, v.sort
FROM (VALUES
  ('Прогреть кофемашину и пролить группы', 'open', 1),
  ('Проверить зерно и помол', 'open', 2),
  ('Проверить молоко и альтернативы', 'open', 3),
  ('Набрать лёд', 'open', 4),
  ('Размен в кассе', 'open', 5),
  ('Витрина десертов и готовых напитков', 'open', 6),
  ('Чистота барной стойки', 'day', 7),
  ('Зал и столы', 'day', 8),
  ('Туалет', 'day', 9),
  ('Пополнить молоко / зерно при необходимости', 'day', 10),
  ('Промыть группы и молокопровод', 'close', 11),
  ('Выключить витрину / убрать скоропорт', 'close', 12),
  ('Сверка кассы нал / перевод', 'close', 13),
  ('Вынести мусор', 'close', 14)
) AS v(title, phase, sort)
WHERE NOT EXISTS (SELECT 1 FROM checklist_tasks t WHERE t.title = v.title);
