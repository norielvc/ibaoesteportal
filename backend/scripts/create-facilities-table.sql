-- Create facilities table for Supabase
-- This table stores barangay facility information displayed on the homepage

CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Building2',
  color VARCHAR(50) DEFAULT 'bg-blue-500',
  images TEXT[] DEFAULT ARRAY['/background.jpg'],
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default facilities
INSERT INTO facilities (name, description, icon, color, images, features, order_index) VALUES
('Health Center', 'Primary healthcare services for residents', 'Heart', 'bg-red-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Free Checkups', 'Vaccination', 'First Aid'], 0),
('Multi-purpose Hall', 'Events, meetings, and community gatherings', 'Building2', 'bg-blue-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['500 Capacity', 'AC Equipped', 'Stage'], 1),
('Daycare Center', 'Early childhood education and care', 'Baby', 'bg-pink-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Ages 3-5', 'Free Education', 'Meals'], 2),
('Barangay Hall', 'Administrative services and assistance', 'Home', 'bg-green-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Documents', 'Assistance', 'Info Desk'], 3),
('Sports Complex', 'Basketball court and fitness area', 'Award', 'bg-orange-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Basketball', 'Volleyball', 'Gym'], 4);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_facilities_order ON facilities(order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to facilities" ON facilities
  FOR SELECT USING (true);

-- Create policies for authenticated users to manage facilities
CREATE POLICY "Allow authenticated users to insert facilities" ON facilities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update facilities" ON facilities
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete facilities" ON facilities
  FOR DELETE USING (auth.role() = 'authenticated');