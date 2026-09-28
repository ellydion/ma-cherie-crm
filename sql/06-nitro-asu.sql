INSERT INTO products (name, unit, quantity, min_threshold, section, price, category, track_stock)
SELECT v.name, 'шт', 0, 0, 'coffee', v.price, v.category, false
FROM (VALUES
  ('Нитро Американо', 220, 'nitro'),
  ('Нитро Латте', 260, 'nitro'),
  ('Нитро Капучино', 250, 'nitro'),
  ('Нитро Колд Брю', 240, 'nitro'),
  ('Нитро Раф', 270, 'nitro'),
  ('Асу Американо', 190, 'asu'),
  ('Асу Латте', 230, 'asu'),
  ('Асу Капучино', 220, 'asu'),
  ('Асу Раф', 240, 'asu'),
  ('Асу Мокко', 250, 'asu'),
  ('Асу Манго', 230, 'asu'),
  ('Асу Клубника', 230, 'asu'),
  ('Асу Матча', 240, 'asu'),
  ('Айс Латте', 220, 'asu'),
  ('Айс Капучино', 210, 'asu'),
  ('Айс Американо', 180, 'asu')
) AS v(name, price, category)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

UPDATE products SET category = 'asu'
WHERE name IN ('Айс Латте','Айс Капучино','Айс Американо','Айс Капучино')
  AND category <> 'asu';

SELECT name, price, category FROM products WHERE category IN ('nitro','asu') ORDER BY category, name;
