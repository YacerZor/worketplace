-- إنشاء دالة لإنشاء الطلبات (اختيارية - للتأكد من عدم وجود مشاكل RLS)
CREATE OR REPLACE FUNCTION create_order(
  p_order_number TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_state TEXT,
  p_city TEXT,
  p_notes TEXT DEFAULT NULL,
  p_delivery_type TEXT DEFAULT 'home',
  p_delivery_fee DECIMAL DEFAULT 0,
  p_total_amount DECIMAL DEFAULT 0,
  p_status TEXT DEFAULT 'pending'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_id INTEGER;
BEGIN
  INSERT INTO orders (
    order_number,
    full_name,
    phone,
    state,
    city,
    notes,
    delivery_type,
    delivery_fee,
    total_amount,
    status,
    created_at
  ) VALUES (
    p_order_number,
    p_full_name,
    p_phone,
    p_state,
    p_city,
    p_notes,
    p_delivery_type,
    p_delivery_fee,
    p_total_amount,
    p_status,
    NOW()
  ) RETURNING id INTO order_id;
  
  RETURN order_id;
END;
$$;

-- منح الصلاحيات للدالة
GRANT EXECUTE ON FUNCTION create_order TO anon;
GRANT EXECUTE ON FUNCTION create_order TO authenticated;
