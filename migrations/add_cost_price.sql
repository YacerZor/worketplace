-- Add cost_price column to products table
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0;

-- Update existing products to have a default cost price (you can adjust this as needed)
UPDATE products SET cost_price = price * 0.7 WHERE cost_price = 0;
