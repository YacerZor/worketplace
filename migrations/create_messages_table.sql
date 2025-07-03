-- إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الإشعارات للإدمين
CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'order',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء مؤشرات للبحث
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);

-- إنشاء سياسة RLS للرسائل
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الرسائل
CREATE POLICY IF NOT EXISTS "Allow public insert access" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated read access" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated delete access" ON messages
  FOR DELETE USING (auth.role() = 'authenticated');

-- سياسات الإشعارات
CREATE POLICY IF NOT EXISTS "Allow authenticated insert access" ON admin_notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated read access" ON admin_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated update access" ON admin_notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated delete access" ON admin_notifications
  FOR DELETE USING (auth.role() = 'authenticated');
