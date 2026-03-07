-- Create official_receipts table to track OR numbers and payments
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS official_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    or_number VARCHAR(20) UNIQUE NOT NULL,
    request_id UUID REFERENCES certificate_requests(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    payment_method VARCHAR(20) DEFAULT 'CASH',
    payment_for TEXT DEFAULT 'BUSINESS PERMIT PROCESSING FEE',
    payor_name TEXT NOT NULL,
    payor_address TEXT,
    business_name TEXT,
    nature_of_business TEXT,
    reference_number VARCHAR(50),
    issued_by UUID REFERENCES users(id),
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_official_receipts_or_number ON official_receipts(or_number);
CREATE INDEX IF NOT EXISTS idx_official_receipts_request_id ON official_receipts(request_id);
CREATE INDEX IF NOT EXISTS idx_official_receipts_issued_date ON official_receipts(issued_date);

-- Add RLS (Row Level Security) policies
ALTER TABLE official_receipts ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all receipts
CREATE POLICY "Allow authenticated users to read receipts" ON official_receipts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert receipts
CREATE POLICY "Allow authenticated users to insert receipts" ON official_receipts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update receipts
CREATE POLICY "Allow authenticated users to update receipts" ON official_receipts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify table creation
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'official_receipts'
ORDER BY ordinal_position;