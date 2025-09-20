-- Enable RLS on used_products table
ALTER TABLE used_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to approved used products" ON used_products;
DROP POLICY IF EXISTS "Allow public insert access to used products" ON used_products;
DROP POLICY IF EXISTS "Allow admin full access to used products" ON used_products;

-- Create new policies
CREATE POLICY "Allow public read access to approved used products" ON used_products
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow public insert access to used products" ON used_products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin full access to used products" ON used_products
    FOR ALL USING (true);

-- Add slug column if it doesn't exist
ALTER TABLE used_products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index on slug for better performance
CREATE INDEX IF NOT EXISTS idx_used_products_slug ON used_products(slug);
CREATE INDEX IF NOT EXISTS idx_used_products_status ON used_products(status);
