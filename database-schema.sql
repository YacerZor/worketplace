-- إنشاء جدول الأقسام
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول المنتجات
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  image TEXT NOT NULL,
  status_ar VARCHAR(50) DEFAULT 'متاح',
  status_en VARCHAR(50) DEFAULT 'Available',
  in_stock BOOLEAN DEFAULT TRUE,
  category_id INTEGER REFERENCES categories(id),
  featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 1) DEFAULT 4.5,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول خيارات المنتجات (الألوان والمقاسات)
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL, -- 'color' أو 'size'
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  value VARCHAR(100) NOT NULL, -- قيمة اللون (مثل #FF0000) أو المقاس (مثل XL)
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الطلبات
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  state VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  notes TEXT,
  delivery_type VARCHAR(50) NOT NULL, -- 'home' أو 'office'
  delivery_fee DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول تفاصيل الطلبات
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_title VARCHAR(255) NOT NULL, -- نحتفظ بالعنوان في حالة حذف المنتج
  product_price DECIMAL(10, 2) NOT NULL, -- نحتفظ بالسعر في وقت الطلب
  quantity INTEGER NOT NULL,
  color VARCHAR(100),
  size VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء مؤشرات للبحث
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- إنشاء سياسة RLS للقراءة العامة
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON product_variants
  FOR SELECT USING (true);

-- سياسات الكتابة للمستخدمين المصرح لهم فقط
CREATE POLICY "Allow authenticated insert access" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert access" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert access" ON product_variants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON product_variants
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access" ON product_variants
  FOR DELETE USING (auth.role() = 'authenticated');

-- سياسات الطلبات
CREATE POLICY "Allow public insert access" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated read access" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- إدخال بعض البيانات الافتراضية للأقسام
INSERT INTO categories (name_ar, name_en, slug, description_ar, description_en, image) VALUES
('رجالي', 'Men', 'men', 'ملابس رجالية فاخرة', 'Luxury men clothing', 'https://images.unsplash.com/photo-1617137968427-85924c800a22'),
('نسائي', 'Women', 'women', 'ملابس نسائية فاخرة', 'Luxury women clothing', 'https://images.unsplash.com/photo-1551803091-e20673f15770'),
('أطفال', 'Kids', 'kids', 'ملابس أطفال فاخرة', 'Luxury kids clothing', 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8'),
('إكسسوارات', 'Accessories', 'accessories', 'إكسسوارات فاخرة', 'Luxury accessories', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a');
