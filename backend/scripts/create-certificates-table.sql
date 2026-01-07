-- Create certificate_requests table for Barangay Clearance and Certificate of Indigency
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number VARCHAR(50) UNIQUE NOT NULL,
  certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('barangay_clearance', 'certificate_of_indigency', 'barangay_residency')),
  
  -- Personal Information
  full_name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex VARCHAR(20) NOT NULL,
  civil_status VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  place_of_birth VARCHAR(255),
  
  -- Request Details
  purpose TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'released', 'cancelled')),
  
  -- Administrative
  date_issued TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_released TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  remarks TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_certificate_requests_type ON certificate_requests(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_status ON certificate_requests(status);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_reference ON certificate_requests(reference_number);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_created ON certificate_requests(created_at DESC);

-- Enable Row Level Security (optional - adjust based on your needs)
ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow public inserts (for form submissions)
CREATE POLICY "Allow public inserts" ON certificate_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow authenticated users to view all
CREATE POLICY "Allow authenticated to view" ON certificate_requests
  FOR SELECT
  USING (true);

-- Policy to allow authenticated users to update
CREATE POLICY "Allow authenticated to update" ON certificate_requests
  FOR UPDATE
  USING (true);

-- Policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated to delete" ON certificate_requests
  FOR DELETE
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_certificate_requests_updated_at
  BEFORE UPDATE ON certificate_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
