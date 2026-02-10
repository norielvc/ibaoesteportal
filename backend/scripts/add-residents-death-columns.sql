-- Add death-related columns to residents table
-- Run this in the Supabase SQL Editor

ALTER TABLE residents ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN DEFAULT FALSE;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS date_of_death TIMESTAMP WITH TIME ZONE;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS cause_of_death TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS covid_related BOOLEAN DEFAULT FALSE;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'residents' 
AND column_name IN ('is_deceased', 'date_of_death', 'cause_of_death', 'covid_related');
