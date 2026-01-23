-- Create events table for Supabase
-- This table stores barangay events/news displayed on the homepage carousel

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(100),
  image TEXT DEFAULT '/background.jpg',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default events
INSERT INTO events (title, description, date, image, order_index) VALUES
('Barangay Clean-Up Drive 2026', 'Join us this Saturday for our monthly community clean-up initiative. Together, we can keep Iba O'' Este beautiful!', 'January 5, 2026', '/background.jpg', 0),
('Free Medical Mission', 'Free check-ups, medicines, and health consultations for all residents. Bring your Barangay ID.', 'January 10, 2026', '/background.jpg', 1),
('Livelihood Training Program', 'Register now for free skills training in food processing, handicrafts, and more!', 'January 15, 2026', '/background.jpg', 2);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_order ON events(order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to events" ON events
  FOR SELECT USING (true);

-- Create policies for authenticated users to manage events
CREATE POLICY "Allow authenticated users to insert events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update events" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete events" ON events
  FOR DELETE USING (auth.role() = 'authenticated');