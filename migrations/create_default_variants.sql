-- إنشاء جدول الألوان الافتراضية
CREATE TABLE IF NOT EXISTS default_colors (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  value VARCHAR(7) NOT NULL, -- قيمة اللون (مثل #FF0000)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(value) -- منع تكرار نفس اللون
);

-- إنشاء جدول المقاسات الافتراضية
CREATE TABLE IF NOT EXISTS default_sizes (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  value VARCHAR(50) NOT NULL, -- قيمة المقاس (مثل XL)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(value) -- منع تكرار نفس المقاس
);

-- إنشاء مؤشرات للبحث
CREATE INDEX IF NOT EXISTS idx_default_colors_name_ar ON default_colors(name_ar);
CREATE INDEX IF NOT EXISTS idx_default_colors_name_en ON default_colors(name_en);
CREATE INDEX IF NOT EXISTS idx_default_sizes_name_ar ON default_sizes(name_ar);
CREATE INDEX IF NOT EXISTS idx_default_sizes_name_en ON default_sizes(name_en);
CREATE INDEX IF NOT EXISTS idx_default_sizes_value ON default_sizes(value);

-- سياسات RLS للقراءة العامة
ALTER TABLE default_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_sizes ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة العامة
CREATE POLICY "Allow public read access" ON default_colors
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON default_sizes
  FOR SELECT USING (true);

-- سياسات الكتابة للمستخدمين المصرح لهم فقط
CREATE POLICY "Allow all operations on default_colors for authenticated users" ON default_colors
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations on default_sizes for authenticated users" ON default_sizes
    FOR ALL USING (auth.role() = 'authenticated');

-- إدخال بعض الألوان الافتراضية
INSERT INTO default_colors (name_ar, name_en, value) VALUES
('أحمر', 'Red', '#FF0000'),
('أزرق', 'Blue', '#0000FF'),
('أخضر', 'Green', '#008000'),
('أسود', 'Black', '#000000'),
('أبيض', 'White', '#FFFFFF'),
('رمادي', 'Gray', '#808080'),
('بني', 'Brown', '#A52A2A'),
('وردي', 'Pink', '#FFC0CB'),
('أصفر', 'Yellow', '#FFFF00'),
('برتقالي', 'Orange', '#FFA500'),
('بنفسجي', 'Purple', '#800080'),
('كحلي', 'Navy', '#000080')
ON CONFLICT DO NOTHING;

-- إدخال بعض المقاسات الافتراضية
INSERT INTO default_sizes (name_ar, name_en, value) VALUES
('صغير جداً', 'Extra Small', 'XS'),
('صغير', 'Small', 'S'),
('متوسط', 'Medium', 'M'),
('كبير', 'Large', 'L'),
('كبير جداً', 'Extra Large', 'XL'),
('كبير جداً جداً', 'Double Extra Large', 'XXL'),
('مقاس 38', 'Size 38', '38'),
('مقاس 39', 'Size 39', '39'),
('مقاس 40', 'Size 40', '40'),
('مقاس 41', 'Size 41', '41'),
('مقاس 42', 'Size 42', '42'),
('مقاس 43', 'Size 43', '43'),
('مقاس 44', 'Size 44', '44'),
('مقاس 45', 'Size 45', '45')
ON CONFLICT DO NOTHING;
