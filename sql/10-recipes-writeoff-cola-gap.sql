-- RPC списания + недостающие SKU из прайса Кока-Кола 2026 + техкарты кофе
-- Postmix не добавляем. Coca-Cola 0.25 стекло = 125 с (как просили).

CREATE OR REPLACE FUNCTION decrement_ingredient_quantity(ingredient_id UUID, qty NUMERIC)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS '
BEGIN
  UPDATE ingredients
  SET quantity = GREATEST(quantity - qty, 0), updated_at = NOW()
  WHERE id = ingredient_id;
END;
';

GRANT EXECUTE ON FUNCTION decrement_ingredient_quantity(UUID, NUMERIC) TO authenticated;

INSERT INTO products (name, unit, quantity, min_threshold, section, price, category, track_stock, cost_price)
SELECT v.name, 'шт', 0, 6, 'kitchen', v.price, 'drinks', true, v.cost
FROM (VALUES
  ('Fanta 0.25 стекло', 75, 66.67),
  ('Sprite 0.25 стекло', 75, 66.67),
  ('Coca-Cola Zero 1.5л ПЭТ', 125, 108.33),
  ('Fuse Tea 1л ПЭТ 6шт', 90, 79.17)
) AS v(name, price, cost)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

UPDATE products SET price = 125, cost_price = 66.67, category = 'drinks', track_stock = true
WHERE name IN ('Coca-Cola 0.25 стекло', 'Кола стекло', 'Coca-Cola стекло 0.25');

UPDATE products SET price = 75, cost_price = 66.67 WHERE name = 'Coca-Cola 0.45 Ж/Б';
UPDATE products SET price = 55, cost_price = 50 WHERE name = 'Coca-Cola 0.5 ПЭТ';
UPDATE products SET price = 90, cost_price = 79.17 WHERE name = 'Coca-Cola 1л ПЭТ';
UPDATE products SET price = 125, cost_price = 108.33 WHERE name = 'Coca-Cola 1.5л ПЭТ';
UPDATE products SET price = 160, cost_price = 141.67 WHERE name = 'Coca-Cola 2л ПЭТ';

INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.018, 'кг'
FROM products p, ingredients i
WHERE i.name = 'Зерно эспрессо'
  AND (
    p.name ILIKE '%эспрессо%'
    OR p.name ILIKE '%американо%'
    OR p.name ILIKE '%капучино%'
    OR p.name ILIKE '%латте%'
    OR p.name ILIKE '%флэт%'
    OR p.name ILIKE '%раф%'
    OR p.name ILIKE '%мокко%'
    OR p.name ILIKE '%бамбл%'
    OR p.name ILIKE '%нитро%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_ingredients x
    WHERE x.product_id = p.id AND x.ingredient_id = i.id
  );

INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.18, 'л'
FROM products p, ingredients i
WHERE i.name = 'Молоко 3.2%'
  AND (
    p.name ILIKE '%капучино%'
    OR p.name ILIKE '%латте%'
    OR p.name ILIKE '%флэт%'
    OR p.name ILIKE '%раф%'
    OR p.name ILIKE '%мокко%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM product_ingredients x
    WHERE x.product_id = p.id AND x.ingredient_id = i.id
  );

INSERT INTO product_ingredients (product_id, ingredient_id, quantity, unit)
SELECT p.id, i.id, 0.10, 'кг'
FROM products p, ingredients i
WHERE i.name = 'Лёд'
  AND (p.name ILIKE '%айс%' OR p.name ILIKE '%нитро%' OR p.name ILIKE '%бамбл%')
  AND NOT EXISTS (
    SELECT 1 FROM product_ingredients x
    WHERE x.product_id = p.id AND x.ingredient_id = i.id
  );
