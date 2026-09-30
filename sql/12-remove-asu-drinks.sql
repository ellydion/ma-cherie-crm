ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden_from_techcards BOOLEAN NOT NULL DEFAULT false;

DELETE FROM product_ingredients WHERE product_id IN (
  SELECT id FROM products WHERE name IN (
    'Асу Американо','Асу Латте','Асу Капучино','Асу Раф',
    'Асу Мокко','Асу Манго','Асу Клубника','Асу Матча'
  )
);

DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE name IN (
    'Асу Американо','Асу Латте','Асу Капучино','Асу Раф',
    'Асу Мокко','Асу Манго','Асу Клубника','Асу Матча'
  )
);

DELETE FROM products WHERE name IN (
  'Асу Американо','Асу Латте','Асу Капучино','Асу Раф',
  'Асу Мокко','Асу Манго','Асу Клубника','Асу Матча'
);

UPDATE products SET category = 'coffee', section = 'coffee'
WHERE name IN (
  'Айс Латте','Айс Капучино','Айс Американо',
  'Лимонад Апельсиновый','Лимонад Манго-Маркуйя','Лимонад Клубничный',
  'Клубничный мохито','Бамбл'
);
