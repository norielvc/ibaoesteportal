-- Fix workflow_assignments constraint to include business_permit
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE workflow_assignments DROP CONSTRAINT IF EXISTS chk_request_type;

-- Step 2: Create new constraint with business_permit included
ALTER TABLE workflow_assignments ADD CONSTRAINT chk_request_type CHECK (
  request_type IN (
    'barangay_clearance',
    'certificate_of_indigency', 
    'barangay_residency',
    'medico_legal',
    'business_permit',
    'natural_death',
    'barangay_guardianship',
    'certification_same_person',
    'barangay_cohabitation'
  )
);

-- Verify the constraint was created
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'chk_request_type';