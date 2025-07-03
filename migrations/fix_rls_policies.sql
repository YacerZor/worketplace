-- إزالة السياسات القديمة وإنشاء سياسات جديدة صحيحة

-- حذف السياسات القديمة للطلبات
DROP POLICY IF EXISTS "Allow public insert access" ON orders;
DROP POLICY IF EXISTS "Allow public insert access" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON orders;
DROP POLICY IF EXISTS "Allow authenticated read access" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated update access" ON orders;

-- حذف السياسات القديمة للرسائل
DROP POLICY IF EXISTS "Allow public insert access" ON messages;
DROP POLICY IF EXISTS "Allow authenticated read access" ON messages;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON messages;

-- إنشاء سياسات جديدة للطلبات - السماح للجميع بإدراج الطلبات
CREATE POLICY "Enable insert for all users" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON order_items
  FOR INSERT WITH CHECK (true);

-- السماح للمستخدمين المصرح لهم بقراءة وتحديث الطلبات
CREATE POLICY "Enable read for authenticated users" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users" ON order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- إنشاء سياسات جديدة للرسائل - السماح للجميع بإرسال الرسائل
CREATE POLICY "Enable insert for all users" ON messages
  FOR INSERT WITH CHECK (true);

-- السماح للمستخدمين المصرح لهم بقراءة وحذف الرسائل
CREATE POLICY "Enable read for authenticated users" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON messages
  FOR DELETE USING (auth.role() = 'authenticated');

-- إنشاء سياسات للإشعارات
CREATE POLICY "Enable insert for all users" ON admin_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON admin_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON admin_notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON admin_notifications
  FOR DELETE USING (auth.role() = 'authenticated');
