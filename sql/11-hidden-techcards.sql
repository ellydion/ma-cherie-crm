ALTER TABLE products
  ADD COLUMN IF NOT EXISTS hidden_from_techcards BOOLEAN NOT NULL DEFAULT false;
