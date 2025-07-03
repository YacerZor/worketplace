-- إضافة عمود رقم الطلب إلى جدول الطلبات
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE;

-- إنشاء مؤشر لرقم الطلب
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- تحديث الطلبات الموجودة لإضافة أرقام طلبات عشوائية
UPDATE orders 
SET order_number = 'ORD' || LPAD(EXTRACT(EPOCH FROM created_at)::text, 10, '0') || LPAD((RANDOM() * 10000)::int::text, 4, '0')
WHERE order_number IS NULL;
