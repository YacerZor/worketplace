-- Create used_products table for user-submitted products
CREATE TABLE IF NOT EXISTS used_products (
    id SERIAL PRIMARY KEY,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT NOT NULL,
    description_en TEXT,
    image TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE used_products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view approved used products" ON used_products
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert their own used products" ON used_products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all used products" ON used_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@example.com'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_used_products_status ON used_products(status);
CREATE INDEX IF NOT EXISTS idx_used_products_created_at ON used_products(created_at DESC);
