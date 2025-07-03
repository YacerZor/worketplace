-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert access" ON product_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON product_images
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access" ON product_images
  FOR DELETE USING (auth.role() = 'authenticated');
