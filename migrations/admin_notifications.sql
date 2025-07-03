-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'order',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and insert notifications
CREATE POLICY "Allow authenticated users to read notifications" ON admin_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update notifications" ON admin_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');
